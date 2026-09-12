import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/content/runtime.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
const action = { id: 'reviewed-slack-action', sourceId: 'slack:channel:message', kind: 'slack_message' };
const finding = { id: 'gmail-origin-finding', evidence: [{ sourceId: 'gmail:1:composer' }], actions: [action] };
const initial = { session: { enabled: true }, connected: true, observations: [{ id: 'gmail:1:composer', app: 'gmail' }], findings: [finding], operations: [] };
const succeeded = { id: 'returned-slack-operation', findingId: finding.id, actionId: action.id, sourceId: action.sourceId, kind: action.kind, status: 'succeeded', message: 'Slack confirmed the reviewed message.', finishedAt: '2026-09-12T07:00:00Z' };

async function harness(approveResponse) {
  let listener;
  const sent = [];
  const sandbox = {
    location: { href: 'https://mail.google.com/mail/u/1/#inbox' }, console,
    setInterval() {},
    chrome: { runtime: {
      async sendMessage(message) { sent.push(message); return message.type === 'approve' ? approveResponse(message) : initial; },
      onMessage: { addListener(callback) { listener = callback; } },
    } },
  };
  vm.runInNewContext(code, sandbox);
  await settle();
  return { LT: sandbox.LivingThread, sent, push(state) { let ack; listener({ type: 'state', state }, {}, value => { ack = value; }); return ack; } };
}

test('Gmail-origin approval immediately publishes a Slack-only operation receipt without another poll', async () => {
  const app = await harness(() => ({ ok: true, operations: [succeeded] }));
  await app.LT.approve(finding.id, [action.id]);
  assert.equal(app.LT.getState().operations[0].status, 'succeeded');
  assert.equal(app.LT.getState().operations[0].sourceId, action.sourceId);
  assert.equal(app.sent.filter(message => message.type === 'approve').length, 1);
});

test('an older queued poll cannot downgrade a confirmed remote receipt', async () => {
  const app = await harness(() => ({ ok: true, operations: [succeeded] }));
  await app.LT.approve(finding.id, [action.id]);
  app.push({ ...initial, findings: [], operations: [{ ...succeeded, status: 'queued', finishedAt: undefined }] });
  assert.equal(app.LT.getState().operations[0].status, 'succeeded');
  app.push({ ...initial, findings: [], operations: [] });
  assert.equal(app.LT.getState().operations[0].status, 'succeeded');
  assert.equal(app.sent.filter(message => message.type === 'approve').length, 1);
});

test('approval receipts are limited to the exact requested action, finding, target and kind', async () => {
  const unrelated = [
    { ...succeeded, id: 'other-action', actionId: 'not-reviewed' },
    { ...succeeded, id: 'other-finding', findingId: 'different-finding' },
    { ...succeeded, id: 'other-target', sourceId: 'slack:other:message' },
    { ...succeeded, id: 'other-kind', kind: 'replace_text' },
  ];
  const app = await harness(() => ({ ok: true, operations: [...unrelated, succeeded] }));
  await app.LT.approve(finding.id, [action.id]);
  assert.deepEqual(Array.from(app.LT.getState().operations, operation => operation.id), [succeeded.id]);
});

test('a finding disappearing while approval runs does not lose its captured receipt or replay it', async () => {
  let finish;
  const app = await harness(() => new Promise(resolve => { finish = resolve; }));
  const pending = app.LT.approve(finding.id, [action.id]);
  app.push({ ...initial, findings: [] });
  finish({ ok: true, operations: [succeeded] });
  await pending;
  assert.equal(app.LT.getState().operations[0].id, succeeded.id);
  assert.equal(app.sent.filter(message => message.type === 'approve').length, 1);
});

test('pushed state is explicitly acknowledged before any adapter work can hold the sender', async () => {
  const app = await harness(() => ({ ok: true, operations: [] }));
  app.LT.registerAdapter({ app: 'gmail', scan: () => new Promise(() => {}) });
  const ack = app.push(initial);
  assert.equal(ack.ok, true);
  assert.equal(app.LT.getState().connected, true);
});
