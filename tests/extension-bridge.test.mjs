import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/background.js', import.meta.url), 'utf8');
function setup({ holdFirstState = false } = {}) {
  let listener, token, paired = false, enabled = false, releasePoll;
  const calls = [];
  const chrome = {
    runtime: { id: 'a'.repeat(32), onMessage: { addListener: value => { listener = value; } } },
    storage: { local: { get: async () => ({ token }), set: async value => { token = value.token; } } },
    tabs: { query: async () => [], onRemoved: { addListener() {} }, onUpdated: { addListener() {} } },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    alarms: { create() {}, onAlarm: { addListener() {} } },
  };
  const response = (status, value) => ({ ok: status === 200, status, json: async () => value });
  const fetch = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === '/api/pair') { paired = true; return response(200, { token: 'test-only-token' }); }
    if (path === '/api/state' && holdFirstState) {
      holdFirstState = false;
      return new Promise(resolve => { releasePoll = () => resolve(response(401, { error: 'Pair this extension.' })); });
    }
    if (!paired || options.headers.Authorization !== 'Bearer test-only-token') return response(401, { error: 'Pair this extension.' });
    if (path === '/api/session') enabled = JSON.parse(options.body).enabled;
    if (path === '/api/commands') return response(200, []);
    return response(200, { session: { enabled }, observations: [], findings: [], operations: [] });
  };
  vm.runInNewContext(code, { chrome, fetch, AbortSignal, console });
  return {
    calls,
    message: value => new Promise(resolve => listener(value, {}, resolve)),
    releasePoll: () => releasePoll(),
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
