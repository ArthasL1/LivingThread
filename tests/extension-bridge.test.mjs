import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/background.js', import.meta.url), 'utf8');
function setup({ holdFirstState = false, exportResponse, hangTabState = false, holdActions = false, holdFirstTabQuery = false } = {}) {
  let listener, token, paired = false, enabled = false, releasePoll;
  let releaseTabQuery;
  let queuedCommands = [];
  const pendingActions = [];
  const deliveredActions = [];
  const publishedStates = [];
  const calls = [];
  const chrome = {
    runtime: { id: 'a'.repeat(32), onMessage: { addListener: value => { listener = value; } } },
    storage: { local: { get: async () => ({ token }), set: async value => { token = value.token; } } },
    tabs: { query: async () => {
      if (holdFirstTabQuery) {
        holdFirstTabQuery = false;
        return new Promise(resolve => { releaseTabQuery = () => resolve([{ id: 12 }]); });
      }
      return hangTabState || releaseTabQuery ? [{ id: 12 }] : [];
    },
      sendMessage: async (tabId, message) => {
        if (message.type === 'state') { publishedStates.push(message.state); return hangTabState ? new Promise(() => {}) : { ok: true }; }
        deliveredActions.push({ tabId, ...message });
        return holdActions ? new Promise(resolve => pendingActions.push(resolve)) : { ok: true };
      },
      onRemoved: { addListener() {} }, onUpdated: { addListener() {} } },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    alarms: { create() {}, onAlarm: { addListener() {} } },
  };
  const response = (status, value) => ({ ok: status === 200, status, json: async () => value });
  const fetch = async (url, options) => {
    if (String(url).startsWith('https://docs.google.com/')) {
      calls.push({ path: 'document-export', url, options });
      return exportResponse || { ok: true, status: 200, headers: new Headers({ 'Content-Type': 'text/plain' }), text: async () => 'Atlas demo on the third floor.' };
    }
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === '/api/pair') { paired = true; return response(200, { token: 'test-only-token' }); }
    if (path === '/api/state' && holdFirstState) {
      holdFirstState = false;
      return new Promise(resolve => { releasePoll = () => resolve(response(401, { error: 'Pair this extension.' })); });
    }
    if (!paired || options.headers.Authorization !== 'Bearer test-only-token') return response(401, { error: 'Pair this extension.' });
    if (path === '/api/session') enabled = JSON.parse(options.body).enabled;
    if (path === '/api/observations') return response(200, { ok: true, changed: false });
    if (path === '/api/commands') { const batch = queuedCommands; queuedCommands = []; return response(200, batch); }
    return response(200, { session: { enabled }, observations: [], findings: [], operations: [] });
  };
  vm.runInNewContext(code, { chrome, fetch, AbortSignal, console, URL, setTimeout: (callback, ms) => setTimeout(callback, ms).unref(), clearTimeout });
  return {
    calls,
    message: (value, sender = {}) => new Promise(resolve => listener(value, sender, resolve)),
    releasePoll: () => releasePoll(),
    enqueueCommands: commands => { queuedCommands.push(...commands); },
    deliveredActions,
    finishNextAction: result => pendingActions.shift()(result),
    publishedStates,
    releaseTabQuery: () => releaseTabQuery(),
  };
}

test('background pairing is explicit and an active session requires a second user action', async () => {
  const bridge = setup();
  const offline = await bridge.message({ type: 'state' });
  assert.equal(offline.connected, false);
  assert.equal(bridge.calls.some(call => call.path === '/api/pair'), false);
  const connected = await bridge.message({ type: 'connect' });
  assert.equal(connected.connected, true);
  assert.equal(connected.session.enabled, false);
  const active = await bridge.message({ type: 'session', enabled: true });
  assert.equal(active.connected, true);
  assert.equal(active.session.enabled, true);
  assert.equal(bridge.calls.filter(call => call.path === '/api/pair').length, 1);
});

const docsSender = { tab: { id: 12 }, frameId: 0, url: 'https://docs.google.com/document/d/test-document/edit?tab=t.0' };
test('document exports require an active session and bind the resource to the sending Docs tab', async () => {
  const bridge = setup();
  await bridge.message({ type: 'connect' });
  assert.match((await bridge.message({ type: 'docs-export', accountSlot: '1' }, docsSender)).error, /paused/);
  await bridge.message({ type: 'session', enabled: true });
  const read = await bridge.message({ type: 'docs-export', accountSlot: '1', url: 'https://unrelated.example/secret' }, docsSender);
  assert.equal(read.body, 'Atlas demo on the third floor.');
  const request = bridge.calls.find(call => call.path === 'document-export');
  assert.equal(request.url, 'https://docs.google.com/document/d/test-document/export?format=txt&tab=t.0&authuser=1');
  assert.equal(request.options.credentials, 'include');
  for (const sender of [{}, { ...docsSender, tab: { id: 12, url: 'https://mail.google.com/' } }, { ...docsSender, url: 'https://mail.google.com/' }]) {
    assert.match((await bridge.message({ type: 'docs-export' }, sender)).error, /open Google Doc/);
  }
  assert.equal(bridge.calls.filter(call => call.path === 'document-export').length, 1);
});

test('document editor frames are bound to their real parent tab, not a caller-supplied URL', async () => {
  const bridge = setup();
  await bridge.message({ type: 'connect' });
  await bridge.message({ type: 'session', enabled: true });
  const result = await bridge.message({ type: 'docs-export', url: 'https://unrelated.example/' }, {
    tab: { id: 12, url: docsSender.url }, frameId: 2, url: 'about:blank'
  });
  assert.equal(result.body, 'Atlas demo on the third floor.');
  assert.match(bridge.calls.find(call => call.path === 'document-export').url, /\/test-document\/export\?/);
});

test('a Google sign-in response is not accepted as document content', async () => {
  const bridge = setup({ exportResponse: { ok: true, status: 200, headers: new Headers({ 'Content-Type': 'text/html' }), text: async () => '<html>Sign in</html>' } });
  await bridge.message({ type: 'connect' });
  await bridge.message({ type: 'session', enabled: true });
  const result = await bridge.message({ type: 'docs-export' }, docsSender);
  assert.match(result.error, /did not return document text/);
  assert.equal(result.body, undefined);
});

test('unchanged observations do not start a state-broadcast feedback loop', async () => {
  const bridge = setup();
  await bridge.message({ type: 'connect' });
  await bridge.message({ type: 'session', enabled: true });
  const before = bridge.calls.filter(call => call.path === '/api/state').length;
  await bridge.message({ type: 'observe', observation: { id: 'test' } }, docsSender);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bridge.calls.filter(call => call.path === '/api/state').length, before);
});

test('a stale unauthorized poll cannot become the result of a successful connection', async () => {
  const bridge = setup({ holdFirstState: true });
  const oldPoll = bridge.message({ type: 'state' });
  await new Promise(resolve => setImmediate(resolve));
  const connection = bridge.message({ type: 'connect' });
  await new Promise(resolve => setImmediate(resolve));
  bridge.releasePoll();
  await oldPoll;
  const connected = await connection;
  assert.equal(connected.connected, true);
  assert.equal(connected.error, undefined);
  const lastState = bridge.calls.filter(call => call.path === '/api/state').at(-1);
  assert.equal(lastState.options.headers.Authorization, 'Bearer test-only-token');
});

test('concurrent state requests share a real response instead of a cached success', async () => {
  const bridge = setup({ holdFirstState: true });
  const first = bridge.message({ type: 'state' });
  await new Promise(resolve => setImmediate(resolve));
  const second = bridge.message({ type: 'state' });
  bridge.releasePoll();
  const responses = await Promise.all([first, second]);
  assert.ok(responses.every(value => !value.connected && /^401:/.test(value.error)));
  assert.equal(bridge.calls.filter(call => call.path === '/api/state').length, 1);
});

test('an unresponsive Docs state recipient cannot freeze later service polling', { timeout: 1000 }, async () => {
  const bridge = setup({ hangTabState: true });
  const connected = await bridge.message({ type: 'connect' });
  assert.equal(connected.connected, true);
  const firstCount = bridge.calls.filter(call => call.path === '/api/state').length;
  const later = await bridge.message({ type: 'state' });
  assert.equal(later.connected, true);
  assert.equal(bridge.calls.filter(call => call.path === '/api/state').length, firstCount + 1);
  assert.equal(bridge.deliveredActions.length, 0);
  assert.equal(bridge.calls.filter(call => call.path === '/api/approve').length, 0);
});

test('nonblocking state publication preserves one serial command pump without replay', { timeout: 1000 }, async () => {
  const bridge = setup({ hangTabState: true, holdActions: true });
  await bridge.message({ type: 'connect' });
  bridge.enqueueCommands([
    { operationId: 'first-operation', tabId: 12, action: { id: 'first-edit', kind: 'replace_text' } },
    { operationId: 'second-operation', tabId: 24, action: { id: 'second-edit', kind: 'replace_text' } },
  ]);
  const first = bridge.message({ type: 'state' });
  await new Promise(resolve => setImmediate(resolve));
  const concurrent = bridge.message({ type: 'state' });
  assert.deepEqual(bridge.deliveredActions.map(item => item.action.id), ['first-edit']);
  bridge.finishNextAction({ ok: true, message: 'First edit verified.' });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(bridge.deliveredActions.map(item => item.action.id), ['first-edit', 'second-edit']);
  assert.equal(bridge.calls.filter(call => call.path === '/api/results').length, 1);
  bridge.finishNextAction({ ok: true, message: 'Second edit verified.' });
  await Promise.all([first, concurrent]);
  await bridge.message({ type: 'state' });
  assert.equal(bridge.deliveredActions.length, 2);
  assert.equal(bridge.calls.filter(call => call.path === '/api/results').length, 2);
  assert.equal(bridge.calls.filter(call => call.path === '/api/approve').length, 0);
});

test('a delayed old tab lookup cannot broadcast stale session state over a newer snapshot', { timeout: 1000 }, async () => {
  const bridge = setup({ holdFirstTabQuery: true });
  await bridge.message({ type: 'connect' });
  assert.equal(bridge.publishedStates.length, 0, 'The paused snapshot is waiting on its tab lookup.');
  await bridge.message({ type: 'session', enabled: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bridge.publishedStates.length, 1);
  assert.equal(bridge.publishedStates[0].session.enabled, true);
  bridge.releaseTabQuery();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bridge.publishedStates.length, 1, 'The obsolete paused snapshot must be discarded.');
  assert.equal(bridge.deliveredActions.length, 0);
  assert.equal(bridge.calls.filter(call => call.path === '/api/approve').length, 0);
});
