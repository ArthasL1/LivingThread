import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/popup.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../extension/popup.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const settle = () => new Promise(resolve => setImmediate(resolve));
const disconnected = { connected: false, session: { enabled: false }, error: 'Pairing required', observations: [], findings: [] };
const connected = { ...disconnected, connected: true, error: '' };

function harness(responder) {
  function element() {
    return { dataset: {}, textContent: '', hidden: false, disabled: false, listeners: new Map(), children: [],
      addEventListener(name, callback) { this.listeners.set(name, callback); },
      replaceChildren() { this.children = []; }, append(...children) { this.children.push(...children); },
    };
  }
  const elements = new Map(ids.map(id => [id, element()]));
  const sent = [];
  let interval;
  vm.runInNewContext(code, {
    document: { getElementById: id => elements.get(id), createElement: element, createTextNode: text => ({ textContent: text }) },
    chrome: { runtime: { id: 'test-extension', getManifest: () => ({ version: '0.1.42' }), sendMessage(message) { sent.push(message); return responder(message); } } },
    setInterval(callback) { interval = callback; },
  });
  return { elements, sent, poll: () => interval(), click: id => elements.get(id).listeners.get('click')() };
}

test('passive popup polling never pairs or starts a session and displays the loaded version', async () => {
  const app = harness(() => Promise.resolve(disconnected));
  await settle();
  await app.poll();
  assert.deepEqual(app.sent.map(message => message.type), ['state', 'state']);
  assert.equal(app.elements.get('version').textContent, 'v0.1.42');
  assert.match(app.elements.get('connection').textContent, /not authorized/);
  assert.equal(app.elements.get('session').disabled, true);
});

test('a click error survives passive failures and only a confirmed connection clears it', async () => {
  let state = disconnected;
  const app = harness(message => Promise.resolve(message.type === 'connect' ? { error: 'Specific pairing rejection' } : state));
  await settle();
  await app.click('connect');
  const original = app.elements.get('error').textContent;
  assert.match(original, /Specific pairing rejection/);
  await app.poll();
  assert.equal(app.elements.get('error').textContent, original);
  assert.equal(app.elements.get('connect').textContent, 'Retry connection');
  state = connected;
  await app.poll();
  assert.equal(app.elements.get('error').hidden, true);
  assert.equal(app.elements.get('connect').hidden, true);
});

test('buttons lock during a connection request and duplicate clicks do not pair twice', async () => {
  let finish;
  const app = harness(message => message.type === 'connect' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(disconnected));
  await settle();
  const pending = app.click('connect');
  assert.equal(app.elements.get('connect').disabled, true);
  assert.equal(app.elements.get('session').disabled, true);
  await app.click('connect');
  await app.poll();
  assert.equal(app.sent.filter(message => message.type === 'connect').length, 1);
  finish(connected);
  await pending;
  assert.equal(app.elements.get('session').disabled, false);
});

test('a late pre-click poll cannot overwrite a successful connection', async () => {
  let finishInitialPoll;
  const app = harness(message => message.type === 'state' ? new Promise(resolve => { finishInitialPoll = resolve; }) : Promise.resolve(connected));
  await app.click('connect');
  finishInitialPoll(disconnected);
  await settle();
  assert.match(app.elements.get('connection').textContent, /Connected · work session paused/);
  assert.equal(app.elements.get('connect').hidden, true);
});

test('a disconnected cached active session is marked unverified', async () => {
  const app = harness(() => Promise.resolve({ ...disconnected, session: { enabled: true } }));
  await settle();
  assert.equal(app.elements.get('session').disabled, true);
  assert.match(app.elements.get('session-note').textContent, /unverified/);
  assert.equal(JSON.parse(app.elements.get('diagnostics').textContent).session, 'unverified');
  assert.match(app.elements.get('summary').textContent, /^Last received:/);
});

test('session action needs its requested state confirmed and polling never retries the mutation', async () => {
  let state = connected;
  const app = harness(() => Promise.resolve(state));
  await settle();
  await app.click('session');
  assert.match(app.elements.get('error').textContent, /has not confirmed/);
  await app.poll();
  assert.equal(app.elements.get('error').hidden, false);
  assert.equal(app.sent.filter(message => message.type === 'session').length, 1);
  state = { ...connected, session: { enabled: true } };
  await app.poll();
  assert.equal(app.elements.get('error').hidden, true);
  assert.equal(app.elements.get('session').textContent, 'Pause work session');
});
