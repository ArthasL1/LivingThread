import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOperationJournal } from '../server/journal.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'livingthread-journal-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, file: join(directory, 'operations.json') };
}

function operation(id, status = 'queued') {
  return { id, actionId: `action-${id}`, findingId: 'finding-1', sourceId: 'slack:T123:C123:123',
    kind: 'slack_message', status, message: 'Reviewed operation.', createdAt: '2026-09-12T03:00:00.000Z' };
}

function serialized(revision, operations) {
  const payload = { schema: 1, revision, operations };
  return JSON.stringify({ ...payload, checksum: createHash('sha256').update(JSON.stringify(payload)).digest('hex') });
}

test('new journal persists exact metadata and returns isolated copies', async t => {
  const { file } = await fixture(t);
  const journal = await createOperationJournal(file);
  assert.deepEqual(journal.readAll(), []);
  const value = operation('one', 'succeeded');
  await journal.record(value);
  assert.deepEqual(journal.readAll(), [value]);
  value.message = 'Caller mutation';
  const snapshot = journal.readAll(); snapshot[0].status = 'failed';
  assert.equal(journal.readAll()[0].status, 'succeeded');
  assert.equal(journal.readAll()[0].message, 'Reviewed operation.');
  assert.deepEqual((await createOperationJournal(file)).readAll(), journal.readAll());
});

test('serialized writes preserve concurrent operations and each latest transition', async t => {
  const { file } = await fixture(t);
  const journal = await createOperationJournal(file);
  await Promise.all(Array.from({ length: 15 }, (_, index) => journal.record(operation(`operation-${index}`, 'succeeded'))));
  await Promise.all([
    journal.record(operation('same', 'queued')),
    journal.record({ ...operation('same', 'running'), startedAt: 123456789 }),
    journal.record(operation('same', 'succeeded')),
  ]);
  const reopened = await createOperationJournal(file);
  assert.equal(reopened.readAll().length, 16);
  assert.equal(reopened.readAll().find(value => value.id === 'same').status, 'succeeded');
  assert.equal(JSON.parse(await readFile(file, 'utf8')).revision, 18);
});

test('restart converts queued/running to durable uncertain records and never returns commands', async t => {
  const { file } = await fixture(t);
  const journal = await createOperationJournal(file);
  for (const status of ['queued', 'running', 'succeeded', 'failed', 'uncertain', 'cancelled']) {
    await journal.record(operation(status, status));
  }
  const reopened = await createOperationJournal(file);
  const values = reopened.readAll();
  assert.deepEqual(values.map(value => value.status), ['uncertain', 'uncertain', 'succeeded', 'failed', 'uncertain', 'cancelled']);
  assert.match(values[0].message, /Check the target manually/);
  assert.equal('commands' in reopened, false);
  assert.deepEqual((await createOperationJournal(file)).readAll(), values);
});

test('complete newer pending snapshot is promoted and its in-flight operations become uncertain', async t => {
  const { file, directory } = await fixture(t);
  await writeFile(file, serialized(1, [operation('old', 'succeeded')]));
  await writeFile(`${file}.tmp`, serialized(2, [operation('old', 'succeeded'), operation('new', 'running')]));
  const journal = await createOperationJournal(file);
  assert.equal(journal.readAll().length, 2);
  assert.equal(journal.readAll()[1].status, 'uncertain');
  assert.deepEqual(await readdir(directory), ['operations.json']);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).revision, 3);
});

test('complete pending first snapshot recovers when the final file was never renamed', async t => {
  const { file } = await fixture(t);
  await writeFile(`${file}.tmp`, serialized(1, [operation('pending', 'succeeded')]));
  const journal = await createOperationJournal(file);
  assert.equal(journal.readAll()[0].status, 'succeeded');
  assert.equal(JSON.parse(await readFile(file, 'utf8')).revision, 1);
});

test('truncated pending write surfaces corruption and preserves valid prior records for explicit recovery', async t => {
  const { file } = await fixture(t);
  const prior = serialized(3, [operation('prior', 'succeeded'), operation('pending', 'running')]);
  await writeFile(file, prior);
  await writeFile(`${file}.tmp`, '{"schema":1,"revision":4,"operations":[');
  await assert.rejects(createOperationJournal(file), failure => {
    assert.equal(failure.code, 'JOURNAL_CORRUPT');
    assert.equal(failure.recoveredOperations[0].status, 'succeeded');
    assert.equal(failure.recoveredOperations[1].status, 'uncertain');
    return true;
  });
  assert.equal(await readFile(file, 'utf8'), prior);
  assert.equal(await readFile(`${file}.tmp`, 'utf8'), '{"schema":1,"revision":4,"operations":[');
});

test('tampered checksum and divergent equal revisions fail instead of resetting protection', async t => {
  const { file } = await fixture(t);
  await writeFile(file, serialized(2, [operation('x', 'succeeded')]).replace('succeeded', 'failed'));
  await assert.rejects(createOperationJournal(file), { code: 'JOURNAL_CORRUPT' });
  await writeFile(file, serialized(2, [operation('x', 'succeeded')]));
  await writeFile(`${file}.tmp`, serialized(2, [operation('x', 'failed')]));
  await assert.rejects(createOperationJournal(file), { code: 'JOURNAL_CORRUPT' });
});

test('credential/config fields and unsupported metadata are rejected before serialization', async t => {
  const { file, directory } = await fixture(t);
  const journal = await createOperationJournal(file);
  await assert.rejects(journal.record({ ...operation('x'), apiKey: 'synthetic-never-write-me' }), { code: 'JOURNAL_INVALID_OPERATION' });
  await assert.rejects(journal.record({ ...operation('x'), config: { token: 'synthetic' } }), { code: 'JOURNAL_INVALID_OPERATION' });
  await assert.rejects(journal.record({ ...operation('x'), status: 'invented' }), { code: 'JOURNAL_INVALID_OPERATION' });
  assert.deepEqual(await readdir(directory), []);
  await journal.record(operation('valid', 'succeeded'));
  assert.equal((await readFile(file, 'utf8')).includes('synthetic-never-write-me'), false);
});

test('storage failure blocks subsequent writes and leaves the committed in-memory state intact', async t => {
  const { file } = await fixture(t);
  const journal = await createOperationJournal(file);
  await journal.record(operation('saved', 'succeeded'));
  await mkdir(`${file}.tmp`);
  await assert.rejects(journal.record(operation('not-saved')), { code: 'JOURNAL_IO' });
  await assert.rejects(journal.record(operation('must-block')), { code: 'JOURNAL_IO' });
  assert.deepEqual(journal.readAll().map(value => value.id), ['saved']);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).operations.map(value => value.id), ['saved']);
});
