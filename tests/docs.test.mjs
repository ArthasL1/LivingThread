import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../extension/content/docs.js', import.meta.url), 'utf8');

function harness({ replaceWorks = true, exportDelay = 0 } = {}) {
  let now = Date.parse('2026-09-12T05:00:00Z');
  let body = 'The Atlas demo is on the third floor.';
  let label = 'Document status: Saved to Drive.';
  let mutation;
  let adapter;
  let actionHandler;
  let failure;
  let dialogOpen = false;
  let inputClicks = 0;
  const exports = [];
  const reports = [];
  const observations = [];
  class Clock extends Date { static now() { return now; } }
  class Input {
    set value(value) { this.content = value; }
    get value() { return this.content || ''; }
    getBoundingClientRect() { return { width: 100 }; }
    dispatchEvent() {}
  }
  const inputs = [new Input(), new Input()];
  const checks = [true, false, false].map(checked => ({ checked, click() { this.checked = !this.checked; } }));
  function setSave(next) { label = next; mutation?.(); }
  const close = { click() { dialogOpen = false; } };
  const replace = { textContent: 'Replace', getAttribute: () => null, disabled: false, click() {
    inputClicks++;
    setSave('Document status: Saving...');
    if (replaceWorks) body = body.replace(inputs[0].value, inputs[1].value);
    setSave('Document status: Saved to Drive.');
  } };
  const dialog = {
    innerText: 'Find and replace 1 of 1',
    get isConnected() { return dialogOpen; },
    querySelector: () => close,
    querySelectorAll(selector) {
      if (selector.includes('checkbox')) return checks;
      if (selector.includes('input')) return inputs;
      if (selector.includes('button')) return [replace];
      return [];
    },
  };
  const document = {
    title: 'Atlas demo - Google Docs', documentElement: {},
    querySelector(selector) {
      if (selector === '#docs-save-indicator-badge') return { getAttribute: () => label };
      if (selector === '.docs-title-input') return { value: 'Atlas demo' };
      if (selector === '#docs-branding-logo-link') return { href: 'https://docs.google.com/document/u/1/?authuser=1' };
      if (selector === '.kix-appview-editor') return { focus() {} };
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[role="dialog"]') return dialogOpen ? [dialog] : [];
      return [];
    },
  };
  vm.runInNewContext(code, {
    document,
    location: { pathname: '/document/d/test-doc/edit', href: 'https://docs.google.com/document/d/test-doc/edit?authuser=1' },
    URL, Date: Clock, HTMLInputElement: Input, Event: class {},
    setTimeout(callback, delay) { now += delay; queueMicrotask(callback); },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} },
    LivingThread: {
      registerAdapter(value) { adapter = value; }, onAction(value) { actionHandler = value; }, rescan() {},
      async report(value) { reports.push(value); }, async observe(value) { observations.push(value); },
      async request(message) {
        if (message.type === 'docs-export') {
          exports.push(now);
          now += exportDelay;
          if (failure) throw new Error(failure);
          return { body };
        }
        if (message.type === 'capabilities') return { docsEditor: true };
        if (message.type === 'debugger' && message.params?.type === 'keyDown' && message.params?.code === 'KeyH') dialogOpen = true;
        return {};
      },
    },
  });
  return {
    scan: () => adapter.scan(),
    edit: () => actionHandler({ kind: 'replace_text', sourceId: observations.at(-1).id, expectedText: observations.at(-1).text, before: 'third floor', after: 'fifth floor' }),
    advance(ms) { now += ms; }, setSave, fail(message) { failure = message; },
    exports, reports, observations, get inputClicks() { return inputClicks; }, get now() { return now; },
  };
}

test('idle scans reuse the export for 30 seconds and expose the loaded read policy', async () => {
  const app = harness();
  await app.scan();
  assert.equal(app.exports.length, 1);
  app.advance(29999);
  await app.scan();
  assert.equal(app.exports.length, 1);
  app.advance(1);
  await app.scan();
  assert.equal(app.exports.length, 2);
  assert.equal(app.observations.at(-1).context.readPolicy, 'docs-export-v3-idle30s-save-refresh-backoff60s');
  assert.ok(app.reports.some(report => report.details?.rateLimitBackoffMs === 60000));
});

test('a Saving to Saved transition refreshes before the idle interval expires', async () => {
  const app = harness();
  await app.scan();
  app.advance(1000);
  app.setSave('Document status: Saving...');
  app.setSave('Document status: Saved to Drive.');
  await app.scan();
  assert.equal(app.exports.length, 2);
  await app.scan();
  assert.equal(app.exports.length, 2, 'An unchanged Saved label must not create a polling loop.');
});

test('429 backs off for 60 seconds and an approved write cannot bypass the backoff', async () => {
  const app = harness();
  await app.scan();
  app.advance(30000);
  app.fail('Document export returned HTTP 429');
  assert.equal((await app.scan()).length, 0);
  const attempts = app.exports.length;
  app.advance(59999);
  await app.scan();
  const result = await app.edit();
  assert.equal(app.exports.length, attempts);
  assert.equal(app.inputClicks, 0);
  assert.equal(result.inputAttempted, false);
  app.advance(1);
  app.fail(null);
  await app.scan();
  assert.equal(app.exports.length, attempts + 1);
});

test('approved edits force a fresh precondition read and verify exact saved text', async () => {
  const app = harness();
  await app.scan();
  const result = await app.edit();
  assert.equal(app.exports.length, 3, 'One initial observation, one precondition export, one verification export.');
  assert.equal(result.ok, true);
  assert.equal(result.inputAttempted, true);
  assert.match(result.observation.text, /fifth floor/);
});

test('unmatched edits use at most three spaced verification exports and remain uncertain', async () => {
  const app = harness({ replaceWorks: false });
  await app.scan();
  const result = await app.edit();
  assert.equal(result.status, 'uncertain');
  assert.equal(result.inputAttempted, true);
  const verification = app.exports.slice(2);
  assert.equal(verification.length, 3);
  assert.ok(verification[1] - verification[0] >= 4000);
  assert.ok(verification[2] - verification[1] >= 4000);
});

test('slow verification stops within its bounded window instead of issuing all three reads', async () => {
  const app = harness({ replaceWorks: false, exportDelay: 8000 });
  await app.scan();
  const result = await app.edit();
  const verification = app.exports.slice(2);
  assert.equal(result.status, 'uncertain');
  assert.ok(verification.length <= 2);
  assert.ok(app.now - verification[0] < 30000);
});
