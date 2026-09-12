import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { WorkState } from './state.mjs';
import { createOperationJournal } from './journal.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const config = await loadConfig(root);
const state = new WorkState();
const runtime = resolve(root, process.env.LIVINGTHREAD_RUNTIME || '.runtime');
await mkdir(runtime, { recursive: true });
const journal = await createOperationJournal(resolve(runtime, 'operations.json'));
state.operations = journal.readAll();
let journalError = '';
async function persistOperation(operation) {
  try { await journal.record(operation); }
  catch { journalError = 'Operation history could not be saved. External actions are blocked until storage is restored.'; state.error = journalError; throw new Error(journalError); }
}
const pairingPath = resolve(runtime, 'pairing.json');
let pairing = JSON.parse(await readFile(pairingPath, 'utf8').catch(() => 'null'));
let timer;
let analyzing = false;
let analysisController;
let analysisDirty = false;
let slack;

function send(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
}
function equal(a, b) { const left = Buffer.from(a || ''), right = Buffer.from(b || ''); return left.length === right.length && timingSafeEqual(left, right); }
async function readBody(request) {
  let data = '';
  for await (const chunk of request) { data += chunk; if (data.length > 250000) throw new Error('Request too large.'); }
  return data ? JSON.parse(data) : {};
}
function scheduleAnalysis() {
  analysisDirty = true;
  clearTimeout(timer);
  timer = setTimeout(analyze, 1500);
}
async function analyze() {
  if (analyzing || !state.session.enabled) return;
  const observations = [...state.observations.values()].filter(o => o.text.trim());
  if (observations.length < 2) return;
  analyzing = true; analysisDirty = false; state.checking = true; state.error = journalError;
  analysisController = new AbortController();
  const revision = state.revision;
  try {
    const { analyzeObservations } = await import('./agent.mjs');
    const result = await analyzeObservations(observations, { config: config.model, clarifications: state.clarifications, signal: analysisController.signal });
    if (revision === state.revision && state.session.enabled) {
      state.acceptFindings(result.findings);
      state.diagnostics.push({ app: 'agent', message: `Checked ${observations.length} sources in ${result.latencyMs} ms.${result.attempts > 1 ? ' Recovered after one read-only retry.' : ''}`, at: new Date().toISOString() });
    } else analysisDirty = true;
  } catch (error) { if (error.code !== 'MODEL_CANCELLED') state.error = error.code === 'ERR_MODULE_NOT_FOUND' ? 'The agent module is being installed.' : String(error.message).slice(0, 400); }
  finally { analysisController = null; analyzing = false; state.checking = false; if (analysisDirty && state.session.enabled) { timer = setTimeout(analyze, 1500); } }
}
async function initializeSlack() {
  try {
    const { createSlackAdapter } = await import('./slack.mjs');
    slack = createSlackAdapter({ ...config.slack, onObservation: observation => { if (state.observe(observation)) scheduleAnalysis(); }, onStatus: status => {
      state.slack = status;
      if (!status.connected) {
        let changed = false;
        for (const [id, source] of state.observations) if (source.app === 'slack' && !source.stale) { state.observations.set(id, { ...source, stale: true }); changed = true; }
        if (changed) { state.revision++; scheduleAnalysis(); }
      }
    } });
    state.slack = slack.getStatus();
  } catch (error) { state.slack = { state: 'unconfigured', message: 'Slack integration is not configured yet.' }; }
}
await initializeSlack();

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || '';
  const claimedId = request.headers['x-livingthread-extension'] || '';
  const extensionOrigin = origin || (/^[a-p]{32}$/.test(claimedId) && request.headers['sec-fetch-site'] === 'none' ? `chrome-extension://${claimedId}` : '');
  if (request.url?.startsWith('/api/')) {
    await writeFile(resolve(runtime, 'last-request.json'), JSON.stringify({ path: request.url, method: request.method, origin, site: request.headers['sec-fetch-site'] || '', at: new Date().toISOString() })).catch(() => {});
    response.on('finish', () => appendFile(resolve(runtime, 'request-history.jsonl'), JSON.stringify({ path: request.url, method: request.method, origin, claimedId, status: response.statusCode, at: new Date().toISOString() }) + '\n').catch(() => {}));
  }
  const validExtension = /^chrome-extension:\/\/[a-p]{32}$/.test(extensionOrigin);
  const originAllowed = validExtension && (!pairing || pairing.origin === extensionOrigin);
  if (originAllowed) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-LivingThread-Extension');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (request.method === 'OPTIONS') { response.writeHead(originAllowed ? 204 : 403); response.end(); return; }
  try {
    if (!['127.0.0.1:' + config.port, 'localhost:' + config.port].includes(request.headers.host)) return send(response, 403, { error: 'Invalid local service host.' });
    const path = new URL(request.url, `http://127.0.0.1:${config.port}`).pathname;
    if (path === '/health' || path === '/') return send(response, 200, { name: 'LivingThread', status: 'ready', version, modelConfigured: !!config.model.apiKey, extensionPaired: !!pairing, sessionEnabled: state.session.enabled });
    if (path === '/api/pair' && request.method === 'POST') {
      if (!originAllowed) return send(response, 403, { error: 'Connect from the LivingThread extension. Another extension may already be paired.' });
      if (!pairing) { pairing = { origin: extensionOrigin, token: randomBytes(32).toString('hex') }; await writeFile(pairingPath, JSON.stringify(pairing), { mode: 0o600 }); }
      return send(response, 200, { token: pairing.token });
    }
    if (!pairing || !equal(request.headers.authorization, `Bearer ${pairing.token}`) || (origin && origin !== pairing.origin)) return send(response, 401, { error: 'Open LivingThread and connect the local service.' });
    const beforeSweep = new Map(state.operations.map(operation => [operation.id, operation.status]));
    state.sweep();
    for (const operation of state.operations) if (beforeSweep.get(operation.id) !== operation.status) await persistOperation(operation);
    if (request.method === 'GET' && path === '/api/state') return send(response, 200, state.snapshot());
    if (request.method !== 'POST') return send(response, 404, { error: 'Not found.' });
    const body = await readBody(request);
    if (path === '/api/session') {
      state.session = { enabled: body.enabled === true, startedAt: body.enabled ? new Date().toISOString() : state.session.startedAt };
      if (state.session.enabled) { if (!slack) await initializeSlack(); await slack?.start(); scheduleAnalysis(); }
      else { analysisController?.abort(); await slack?.stop(); clearTimeout(timer); }
      return send(response, 200, state.snapshot());
    }
    if (path === '/api/observations') { const changed = state.observe(body); if (changed) scheduleAnalysis(); return send(response, 200, { ok: true, changed }); }
    if (path === '/api/closed') { if (state.close(body.tabId, body.activeIds)) scheduleAnalysis(); return send(response, 200, { ok: true }); }
    if (path === '/api/diagnostics') {
      state.diagnostics.push({ ...body, at: new Date().toISOString() }); state.diagnostics = state.diagnostics.slice(-30);
      return send(response, 200, { ok: true });
    }
    if (path === '/api/commands') {
      if (journalError) throw new Error(journalError);
      const queued = new Set(state.operations.filter(operation => operation.status === 'queued').map(operation => operation.id));
      const commands = state.takeCommands();
      // Persist both dispatched attempts and targets rejected before execution.
      for (const operation of state.operations) if (queued.has(operation.id) && operation.status !== 'queued') await persistOperation(operation);
      return send(response, 200, commands);
    }
    if (path === '/api/results') { const result = state.result(body.operationId, body.result); await persistOperation(result); scheduleAnalysis(); return send(response, 200, result); }
    if (path === '/api/approve') {
      if (journalError) throw new Error(journalError);
      const approved = state.approve(body.findingId, body.actionIds);
      for (const { operation } of approved) await persistOperation(operation);
      for (const { operation, action } of approved) if (action.kind === 'slack_message') {
        operation.status = 'running'; operation.startedAt = Date.now();
        await persistOperation(operation);
        try {
          const result = slack ? await slack.postMessage({ channelId: action.channelId, threadTs: action.threadTs, text: action.text, clientMsgId: operation.id }) : { ok: false, message: 'Slack is not configured.' };
          state.result(operation.id, result);
        } catch { state.result(operation.id, { ok: false, status: 'uncertain', message: 'Slack did not return a confirmed result. Check the conversation before retrying.' }); }
        await persistOperation(operation);
      }
      return send(response, 200, { ok: true, operations: approved.map(a => a.operation) });
    }
    if (path === '/api/clarify') {
      const finding = state.findings.find(f => f.id === body.findingId);
      if (!finding || typeof body.text !== 'string' || !body.text.trim()) throw new Error('A current finding and explanation are required.');
      state.clarifications.push({ findingId: finding.id, event: finding.event, sourceIds: finding.evidence.map(e => e.sourceId), text: body.text.slice(0, 3000), at: new Date().toISOString() });
      state.revision++; state.findings = state.findings.filter(f => f.id !== finding.id); scheduleAnalysis();
      return send(response, 200, { ok: true });
    }
    if (path === '/api/dismiss') { state.dismissed.add(body.findingId); state.findings = state.findings.filter(f => f.id !== body.findingId); return send(response, 200, { ok: true }); }
    return send(response, 404, { error: 'Not found.' });
  } catch (error) { send(response, 400, { error: String(error.message).slice(0, 500) }); }
});
server.listen(config.port, '127.0.0.1', () => console.log(`LivingThread ready at http://127.0.0.1:${config.port}. Model configured: ${!!config.model.apiKey}. Load the extension and start a work session.`));
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'LivingThread port is already in use.' : 'LivingThread could not start.'); process.exitCode = 1; });
process.on('SIGINT', async () => { clearTimeout(timer); analysisController?.abort(); await slack?.stop(); server.close(); process.exit(0); });
