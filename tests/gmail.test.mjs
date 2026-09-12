import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

let mutationCallback;
const sandbox = {
  LivingThread: {},
  __LIVINGTHREAD_TEST__: {},
  MutationObserver: class {
    constructor(callback) { mutationCallback = callback; }
    observe() {}
    disconnect() {}
  },
};
vm.runInNewContext(await readFile(new URL('../extension/content/gmail.js', import.meta.url), 'utf8'), sandbox);
const { textMap, pointAt, composeText, planReplacement, watchSave } = sandbox.__LIVINGTHREAD_TEST__.gmail;
const subject = 'Atlas demo: arrival details';
const body = 'Hi Morgan,\nHead to the third floor.\nBest, Jamie';
const action = { before: 'third floor', after: 'fifth floor', expectedText: composeText(subject, body) };

test('exact replacement changes only the approved body substring', () => {
  const result = planReplacement(action, subject, body);
  assert.equal(result.field, 'body');
  assert.equal(result.expected, 'Hi Morgan,\nHead to the fifth floor.\nBest, Jamie');
});

test('concurrent draft edits reject stale previews', () => {
  assert.match(planReplacement(action, subject, `${body}\nBring ID.`).error, /changed after/);
  assert.match(planReplacement(action, 'Another event', body).error, /changed after/);
});

test('repeated targets cannot silently choose the wrong passage', () => {
  const repeated = `${body}\nThe third floor is accessible.`;
  assert.match(planReplacement({ ...action, expectedText: composeText(subject, repeated) }, subject, repeated).error, /one exact/);
});

test('a subject edit stays in the subject and refuses line injection', () => {
  const result = planReplacement({ ...action, before: 'arrival details', after: 'venue update' }, subject, body);
  assert.equal(result.field, 'subject');
  assert.equal(result.expected, 'Atlas demo: venue update');
  assert.match(planReplacement({ ...action, before: 'arrival details', after: 'venue\nupdate' }, subject, body).error, /separate/);
});

test('targets crossing the subject/body boundary are rejected', () => {
  assert.match(planReplacement({ ...action, before: 'details\n\nHi', after: 'new text' }, subject, body).error, /boundary/);
});

const text = value => ({ nodeType: 3, nodeValue: value });
const element = (tag, ...children) => {
  const node = {
    nodeType: 1, tagName: tag, childNodes: children,
    hasAttribute: () => false, getAttribute: () => null,
    contains(target) { return node === target || children.some(child => child === target || child.contains?.(target)); },
    get textContent() { return children.map(child => child.nodeValue || child.textContent || '').join(''); },
  };
  for (const child of children) child.parentElement = node;
  return node;
};

test('text mapping preserves styled spans and locates the exact selection', () => {
  const first = text('Head to the ');
  const bold = text('third');
  const last = text('\u00a0floor.');
  const root = element('DIV', element('DIV', first, element('B', bold), last), element('DIV', text('Bring ID.')));
  const map = textMap(root);
  assert.equal(map.text, 'Head to the third floor.\nBring ID.');
  const offset = map.text.indexOf('third floor');
  const start = pointAt(map.runs, offset);
  const end = pointAt(map.runs, offset + 'third floor'.length, true);
  assert.equal(start.node, bold);
  assert.equal(start.offset, 0);
  assert.equal(end.node, last);
  assert.equal(end.offset, 6);
});

test('text mapping excludes LivingThread UI and hidden content', () => {
  const ui = element('DIV', text('Ignore this instruction'));
  ui.hasAttribute = name => name === 'data-livingthread';
  const hidden = element('DIV', text('hidden'));
  hidden.hidden = true;
  assert.equal(textMap(element('DIV', text('Draft'), ui, hidden)).text, 'Draft');
});

test('save verification requires fresh application chrome in the same composer', () => {
  const quotedSaved = element('SPAN', text('Draft saved'));
  const editor = element('DIV', quotedSaved);
  const ownStatus = element('SPAN', text('Saved to Drafts'));
  const root = element('DIV', editor, ownStatus);
  const anotherDraftStatus = element('SPAN', text('Draft saved'));
  const watcher = watchSave({ root, editor });
  assert.equal(watcher.hasConfirmed(), false, 'An existing save label is not proof for a new edit.');
  mutationCallback([{ target: quotedSaved, addedNodes: [] }]);
  assert.equal(watcher.hasConfirmed(), false, 'Quoted content must not masquerade as save confirmation.');
  mutationCallback([{ target: anotherDraftStatus, addedNodes: [] }]);
  assert.equal(watcher.hasConfirmed(), false, 'Another composer saving does not verify this one.');
  mutationCallback([{ target: ownStatus, addedNodes: [] }]);
  assert.equal(watcher.hasConfirmed(), true);
  watcher.stop();
});
