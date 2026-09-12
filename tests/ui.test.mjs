import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/content/ui.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
const doc = { id: 'docs:atlas:default:1', app: 'docs', title: 'Atlas brief', url: 'https://docs.google.com/document/d/atlas/edit', context: { documentId: 'atlas' }, observedAt: '2026-09-12T05:00:00Z', coverage: 'partial' };
const mail = { id: 'gmail:1:old-composer', app: 'gmail', title: 'Atlas arrival details', url: 'https://mail.google.com/mail/u/1/#drafts', context: { accountSlot: '1', subject: 'Atlas arrival details', body: 'Come to the fifth floor.' }, observedAt: doc.observedAt, coverage: 'full' };
const initialFinding = {
  id: 'reviewed-finding', event: 'Atlas customer demo', kind: 'conflict', summary: 'The venue differs across your draft and brief.', explanation: 'Facilities confirmed the fifth floor.', status: 'open',
  evidence: [{ sourceId: doc.id, quote: 'third floor', role: 'outdated' }, { sourceId: mail.id, quote: 'fifth floor', role: 'current' }],
  actions: [{ id: 'edit-doc', sourceId: doc.id, kind: 'replace_text', before: 'third floor', after: 'fifth floor' }, { id: 'edit-mail', sourceId: mail.id, kind: 'replace_text', before: 'third floor', after: 'fifth floor' }],
};
const ops = (statuses = ['succeeded', 'running']) => [doc, mail].map((item, index) => ({ id: `operation-${index}`, findingId: initialFinding.id, actionId: initialFinding.actions[index].id, sourceId: item.id, kind: 'replace_text', status: statuses[index], message: index ? 'Gmail save verification.' : 'Document export verified.', createdAt: '2026-09-12T05:01:00Z' }));
const baseState = { session: { enabled: true }, connected: true, checking: false, error: '', observations: [doc, mail], findings: [initialFinding], operations: [] };

function harness(initial = baseState, { hostname = 'docs.google.com', anchors = [], approve = async () => ({ ok: true }) } = {}) {
  let shadow;
  let listener;
  let state = initial;
  const requests = [];
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attributes = new Map(); this.dataset = {}; this.style = {}; this.listeners = new Map(); this._text = ''; }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    append(...children) { for (const child of children) { this.children.push(child); child.parentElement = this; } }
    replaceChildren(...children) { this.children = []; this._text = ''; this.append(...children); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    attachShadow() { shadow = new Element('shadow'); return shadow; }
    getElementById(id) { return walk(this).find(node => node.id === id); }
    getBoundingClientRect() { return { left: 800, right: 1200, top: 100, bottom: 700 }; }
    focus() {}
  }
  function walk(node) { return [node, ...node.children.flatMap(walk)]; }
  const anchor = new Element('div');
  vm.runInNewContext(code, {
    document: { querySelector: () => null, createElement: tag => new Element(tag), createTextNode: text => { const node = new Element('text'); node.textContent = text; return node; }, body: new Element('body') },
    location: { hostname, pathname: hostname === 'docs.google.com' ? '/document/d/atlas/edit' : '/mail/u/1/' },
    window: { innerWidth: 1400, innerHeight: 900, addEventListener() {} }, URL,
    LivingThread: { getState: () => state, onState(callback) { listener = callback; callback(state); }, getAnchor: id => anchors.includes(id) ? anchor : null,
      async approve(id, ids) { requests.push({ id, ids }); return approve(id, ids); }, clarify: async () => ({}), dismiss: async () => ({}),
    },
  });
  const mount = () => shadow.children.find(node => node.tagName !== 'STYLE');
  return {
    update(next) { state = next; listener(next); },
    text: () => mount().textContent,
    find: predicate => walk(mount()).find(predicate),
    click(predicate) {
      const node = walk(mount()).find(predicate);
      assert.ok(node, 'Expected a matching visible control.');
      return node.listeners.get('click')();
    }, requests,
  };
}

async function approveBoth(app) {
  app.click(node => node.className === 'notice');
  app.click(node => node.id === 'lt-approve');
  await settle();
}

test('approved operation group survives finding invalidation and new findings remain reachable', async () => {
  const app = harness();
  await approveBoth(app);
  const nextFinding = { ...initialFinding, id: 'replacement-finding', event: 'A later Atlas detail', summary: 'The updated draft needs another review.' };
  app.update({ ...baseState, findings: [nextFinding], operations: ops(), checking: true });
  assert.match(app.text(), /Atlas customer demo/);
  assert.match(app.text(), /Applying your reviewed changes/);
  assert.match(app.text(), /Google Docs · succeeded/);
  assert.match(app.text(), /Gmail · running/);
  assert.match(app.text(), /1 of 2 actions verified/);
  assert.match(app.text(), /Checking related details again/);
  app.click(node => node.className === 'new-finding');
  assert.match(app.text(), /A later Atlas detail/);
  app.click(node => node.tagName === 'BUTTON' && node.textContent === 'Review your recent action results →');
  assert.match(app.text(), /Atlas customer demo/);
  assert.match(app.text(), /Gmail · running/);
  app.click(node => node.tagName === 'BUTTON' && node.textContent === 'Minimize results');
  app.click(node => node.className === 'notice');
  assert.match(app.text(), /A later Atlas detail/);
  assert.doesNotMatch(app.text(), /Your approved action group/);
});

test('a fresh page can reopen only its relevant operation group and labels survive missing cross-app sources', () => {
  const unrelated = { ...doc, id: 'docs:other:default:1', url: 'https://docs.google.com/document/d/other/edit', context: { documentId: 'other' } };
  const app = harness({ ...baseState, observations: [doc, unrelated], findings: [], operations: [...ops(['succeeded', 'succeeded']), { id: 'unrelated-operation', findingId: 'unrelated-finding', sourceId: unrelated.id, status: 'failed', message: 'UNRELATED PRIVATE RESULT' }] });
  assert.match(app.text(), /Review results/);
  app.click(node => node.className === 'pill' && node.tagName === 'BUTTON');
  assert.match(app.text(), /Reviewed actions completed/);
  assert.match(app.text(), /Gmail · succeeded/);
  assert.doesNotMatch(app.text(), /UNRELATED PRIVATE RESULT/);
});

test('completed operations do not imply a completed cross-app check', () => {
  const app = harness({ ...baseState, findings: [], operations: ops(['succeeded', 'succeeded']), checking: true });
  app.click(node => node.className === 'pill');
  assert.match(app.text(), /Checking related details again/);
  assert.doesNotMatch(app.text(), /all aligned|everything is aligned|No open finding/i);
  app.update({ ...baseState, findings: [], operations: ops(['succeeded', 'succeeded']), error: 'Recheck failed' });
  assert.match(app.text(), /latest cross-app check is unavailable/);
  assert.doesNotMatch(app.text(), /No open finding/);
});

test('a failed approval keeps its receipt and never invents a successful operation', async () => {
  const app = harness(baseState, { approve: async () => { throw new Error('Evidence changed before approval.'); } });
  await approveBoth(app);
  assert.match(app.text(), /Approval needs attention/);
  assert.match(app.text(), /No operation result is available/);
  assert.match(app.text(), /Evidence changed before approval/);
  assert.doesNotMatch(app.text(), /actions completed|· succeeded/);
});

test('Gmail receipts are available for the current composer but not inferred after its ID changes', () => {
  const state = { ...baseState, observations: [mail], findings: [], operations: [ops(['succeeded', 'succeeded'])[1]] };
  const app = harness(state, { hostname: 'mail.google.com', anchors: [mail.id] });
  assert.match(app.text(), /Review results/);
  app.click(node => node.className === 'pill');
  assert.match(app.text(), /Gmail · succeeded/);
  const reloaded = { ...mail, id: 'gmail:1:new-composer' };
  const other = harness({ ...state, observations: [reloaded] }, { hostname: 'mail.google.com', anchors: [reloaded.id] });
  assert.doesNotMatch(other.text(), /Review results/);
});

test('an application prefix or ambiguous identical Gmail composers cannot expose unrelated results', () => {
  const first = { ...mail, id: 'gmail:1:new-first' };
  const second = { ...mail, id: 'gmail:1:new-second' };
  const app = harness({ ...baseState, findings: [], observations: [mail, first, second], operations: [ops()[1]] }, { hostname: 'mail.google.com', anchors: [first.id, second.id] });
  assert.doesNotMatch(app.text(), /Review results|Actions in progress/);
  const prefixOnly = harness({ ...baseState, findings: [], observations: [], operations: [ops()[1]] }, { hostname: 'mail.google.com' });
  assert.doesNotMatch(prefixOnly.text(), /Review results|Actions in progress/);
});

test('a Slack-only action approved from Gmail remains visible without unrelated Slack receipt leakage', async () => {
  const slack = { id: 'slack:atlas:proposal', app: 'slack', title: 'Atlas planning', url: 'https://app.slack.com/client/workspace/channel', context: { channelId: 'channel' }, observedAt: doc.observedAt };
  const action = { id: 'slack-only-action', kind: 'slack_message', sourceId: slack.id, text: 'Alex, can facilities support 16:00?', channelId: 'channel', threadTs: '123.456' };
  const finding = { ...initialFinding, id: 'gmail-slack-approval', kind: 'pending', actions: [action], evidence: [{ sourceId: mail.id, quote: '15:00', role: 'current' }, { sourceId: slack.id, quote: '16:00?', role: 'proposal' }] };
  const initial = { ...baseState, observations: [mail, slack], findings: [finding], operations: [] };
  const app = harness(initial, { hostname: 'mail.google.com', anchors: [mail.id] });
  await approveBoth(app);
  const sent = { id: 'sent-operation', findingId: finding.id, actionId: action.id, sourceId: slack.id, kind: action.kind, status: 'succeeded', message: 'Slack confirmed the message was posted.' };
  const unrelated = { ...sent, id: 'other-operation', findingId: 'unrelated-finding', actionId: 'other-action', message: 'UNRELATED SLACK RECEIPT' };
  app.update({ ...initial, findings: [], operations: [sent, unrelated] });
  assert.match(app.text(), /Reviewed actions completed/);
  assert.match(app.text(), /1 of 1 actions verified/);
  assert.match(app.text(), /Slack · succeeded/);
  assert.doesNotMatch(app.text(), /UNRELATED SLACK RECEIPT/);
  assert.equal(app.requests.length, 1);
});
