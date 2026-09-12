import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SCHEMA = 1;
const STATUSES = new Set(['queued', 'running', 'succeeded', 'failed', 'uncertain', 'cancelled']);
const FIELDS = new Set([
  'id', 'actionId', 'findingId', 'sourceId', 'kind', 'status', 'message',
  'createdAt', 'updatedAt', 'startedAt', 'finishedAt', 'channelId', 'threadTs',
  'clientMsgId', 'ts', 'url', 'actualText',
]);
const MAX_BYTES = 16 * 1024 * 1024;
const RECOVERY_MESSAGE = 'The service restarted before this operation was verified. Check the target manually before taking any further action; this operation will not be replayed.';

function error(code, message, recoveredOperations) {
  const value = new Error(message);
  value.code = code;
  if (recoveredOperations) value.recoveredOperations = structuredClone(recoveredOperations);
  return value;
}

function copyOperation(operation) {
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    throw error('JOURNAL_INVALID_OPERATION', 'The operation journal requires a plain operation object.');
  }
  const result = {};
  for (const [key, value] of Object.entries(operation)) {
    // Only operation metadata belongs here. Never serialize adapters, request headers, or config.
    if (!FIELDS.has(key)) throw error('JOURNAL_INVALID_OPERATION', 'Unsupported operation metadata cannot be written to the journal.');
    if (typeof value !== 'string' && !(key === 'startedAt' && Number.isFinite(value))) {
      throw error('JOURNAL_INVALID_OPERATION', 'Operation metadata must use supported string or timestamp fields.');
    }
    if (typeof value === 'string' && value.length > 20000) {
      throw error('JOURNAL_INVALID_OPERATION', 'An operation metadata field exceeds the journal size limit.');
    }
    result[key] = value;
  }
  if (typeof result.id !== 'string' || !result.id.trim() || result.id.length > 400 || !STATUSES.has(result.status)) {
    throw error('JOURNAL_INVALID_OPERATION', 'The operation requires a nonempty ID and a recognized status.');
  }
  if (result.kind && !['replace_text', 'slack_message'].includes(result.kind)) {
    throw error('JOURNAL_INVALID_OPERATION', 'The operation kind is not supported by this journal.');
  }
  return result;
}

function checksum(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function encode(revision, operations) {
  const payload = { schema: SCHEMA, revision, operations };
  const text = `${JSON.stringify({ ...payload, checksum: checksum(payload) }, null, 2)}\n`;
  if (Buffer.byteLength(text) > MAX_BYTES) throw error('JOURNAL_FULL', 'The operation journal is full. No external operation should be executed.');
  return text;
}

function decode(text) {
  const value = JSON.parse(text);
  if (!value || value.schema !== SCHEMA || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.operations)) {
    throw new Error('Invalid journal structure');
  }
  const payload = { schema: value.schema, revision: value.revision, operations: value.operations };
  if (typeof value.checksum !== 'string' || value.checksum !== checksum(payload)) throw new Error('Invalid journal checksum');
  const operations = value.operations.map(copyOperation);
  if (new Set(operations.map(operation => operation.id)).size !== operations.length) throw new Error('Duplicate journal IDs');
  return { revision: value.revision, operations };
}

async function inspect(path) {
  try {
    const text = await readFile(path, 'utf8');
    if (Buffer.byteLength(text) > MAX_BYTES) return { corrupt: true };
    try { return { snapshot: decode(text) }; } catch { return { corrupt: true }; }
  } catch (failure) {
    if (failure.code === 'ENOENT') return { missing: true };
    throw error('JOURNAL_IO', 'The operation journal could not be read. Existing files were preserved.');
  }
}

async function syncDirectory(path) {
  // Windows cannot fsync directory handles. The file itself is always flushed before rename.
  if (process.platform === 'win32') return;
  const directory = await open(path, 'r');
  try { await directory.sync(); } finally { await directory.close(); }
}

function recovered(operations) {
  return operations.map(operation => ['queued', 'running'].includes(operation.status)
    ? { ...operation, status: 'uncertain', message: RECOVERY_MESSAGE, updatedAt: new Date().toISOString() }
    : operation);
}

/**
 * One process owns a journal path. Await record() before dispatching any external operation.
 * A failed durable write poisons this instance; restart/recover before dispatching more work.
 * readAll() returns metadata only. It never reconstructs or replays action commands.
 */
export async function createOperationJournal(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw error('JOURNAL_PATH', 'An operation journal path is required.');
  const path = resolve(filePath);
  const tempPath = `${path}.tmp`;
  const folder = dirname(path);
  const [main, temporary] = await Promise.all([inspect(path), inspect(tempPath)]);
  const valid = [main.snapshot, temporary.snapshot].filter(Boolean).sort((a, b) => b.revision - a.revision);
  if (main.corrupt || temporary.corrupt) {
    throw error('JOURNAL_CORRUPT', 'The operation journal or its pending snapshot is corrupt. Existing files were preserved. Inspect and recover the journal before allowing external operations.', valid[0] ? recovered(valid[0].operations) : undefined);
  }
  if (main.snapshot && temporary.snapshot && main.snapshot.revision === temporary.snapshot.revision
      && JSON.stringify(main.snapshot.operations) !== JSON.stringify(temporary.snapshot.operations)) {
    throw error('JOURNAL_CORRUPT', 'The operation journal has conflicting snapshots at the same revision. Both files were preserved; external operations must remain blocked.');
  }
  let revision = valid[0]?.revision ?? 0;
  let operations = new Map((valid[0]?.operations || []).map(operation => [operation.id, operation]));
  let queue = Promise.resolve();
  let failed = false;

  async function persist(nextOperations) {
    const nextRevision = revision + 1;
    const text = encode(nextRevision, [...nextOperations.values()]);
    let file;
    try {
      await mkdir(folder, { recursive: true });
      file = await open(tempPath, 'w', 0o600);
      await file.writeFile(text, 'utf8');
      await file.sync();
      await file.close();
      file = null;
      await rename(tempPath, path);
      await syncDirectory(folder);
      revision = nextRevision;
      operations = nextOperations;
    } catch {
      failed = true;
      throw error('JOURNAL_IO', 'The operation journal could not be saved durably. Do not execute or replay external operations; preserve the journal files and restart after resolving storage access.');
    } finally {
      if (file) await file.close().catch(() => {});
    }
  }

  // Complete atomic promotion of a valid interrupted write before accepting any new operation.
  if (temporary.snapshot && (!main.snapshot || temporary.snapshot.revision > main.snapshot.revision)) {
    try {
      await rename(tempPath, path);
      await syncDirectory(folder);
    } catch {
      throw error('JOURNAL_IO', 'A complete pending journal snapshot could not be recovered. External operations must remain blocked.');
    }
  }
  const pending = [...operations.values()].some(operation => ['queued', 'running'].includes(operation.status));
  if (pending) await persist(new Map(recovered([...operations.values()]).map(operation => [operation.id, operation])));

  function readAll() { return structuredClone([...operations.values()]); }

  function record(operation) {
    let snapshot;
    try { snapshot = copyOperation(operation); }
    catch (failure) { return Promise.reject(failure); }
    const write = queue.then(async () => {
      if (failed) throw error('JOURNAL_IO', 'Journal persistence previously failed. External operations must remain blocked until recovery.');
      const nextOperations = new Map(operations);
      nextOperations.set(snapshot.id, snapshot);
      await persist(nextOperations);
    });
    // Serialize even after a rejected write; the failed flag blocks unsafe further dispatch.
    queue = write.catch(() => {});
    return write;
  }

  return { readAll, record };
}
