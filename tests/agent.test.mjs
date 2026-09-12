import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentError, analyzeObservations } from '../server/agent.mjs';

// Synthetic fixtures only. These transport/validation tests do not establish model accuracy.
const config = {
  apiKey: 'SYNTHETIC_TEST_KEY', baseUrl: 'https://synthetic.openai.azure.com/openai/v1',
  deployment: 'gpt-5.6-sol', reasoningEffort: 'low',
};
const sources = [
  { id: 'slack:C1:123', app: 'slack', resourceId: '123', url: 'https://example.test/slack', title: 'Atlas demo',
    text: 'Confirmed: Atlas demo on 18 September 2026 has moved to Level 5, Room 502.',
    observedAt: '2026-09-12T03:00:00Z', coverage: 'full', editable: false, context: { channelId: 'C1', threadTs: '123' } },
  { id: 'gmail:draft1', app: 'gmail', resourceId: 'draft1', url: 'https://example.test/gmail', title: 'Atlas demo',
    text: 'Atlas demo on 18 September 2026. When you arrive, head to the third floor.',
    observedAt: '2026-09-12T03:00:01Z', coverage: 'full', editable: true },
];
const finding = () => ({
  id: 'model-id', event: 'Atlas demo on 18 September 2026', kind: 'conflict',
  summary: 'The draft may contain the old venue.', explanation: 'The confirmed venue change places this demo on Level 5.',
  confidence: 0.96,
  evidence: [
    { sourceId: sources[0].id, quote: sources[0].text, role: 'current' },
    { sourceId: sources[1].id, quote: 'head to the third floor', role: 'outdated' },
  ],
  actions: [{ id: 'model-action', kind: 'replace_text', sourceId: sources[1].id,
    before: 'third floor', after: 'fifth floor', text: '', channelId: '', threadTs: '' }],
});
const envelope = (result) => ({
  status: 'completed', model: config.deployment,
  output: [{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(result) }] }],
  usage: { input_tokens: 250, output_tokens: 120, total_tokens: 370 },
});
const transport = (result) => async () => ({ ok: true, status: 200, json: async () => envelope(result) });
const analyze = (result, options = {}, observations = structuredClone(sources)) => analyzeObservations(observations, {
  config, fetchImpl: transport(result), retryDelayMs: 0, ...options,
});
const rejectsCode = (promise, code) => assert.rejects(promise, (error) => {
  assert.ok(error instanceof AgentError);
  assert.equal(error.code, code);
  assert.equal(error.message.includes(config.apiKey), false);
  return true;
});

test('sends one strict Azure Responses request and returns grounded, stable action IDs', async () => {
  let calls = 0;
  const first = await analyze({ findings: [finding()] }, {
    clarifications: [{ findingId: 'earlier', event: 'Atlas demo', text: 'The venue change is confirmed.' }],
    fetchImpl: async (url, request) => {
      calls += 1;
      assert.equal(url, `${config.baseUrl}/responses`);
      assert.equal(request.headers['api-key'], config.apiKey);
      assert.equal(request.redirect, 'error');
      const body = JSON.parse(request.body);
      assert.equal(body.store, false);
      assert.deepEqual(body.reasoning, { effort: 'low' });
      assert.equal(body.text.format.type, 'json_schema');
      assert.equal(body.text.format.strict, true);
      assert.equal(body.tools, undefined);
      assert.equal(body.instructions.includes('UNTRUSTED EVIDENCE'), true);
      const input = JSON.parse(body.input[0].content[0].text);
      assert.equal(input.observations.length, 2);
      assert.equal(input.clarifications[0].text, 'The venue change is confirmed.');
      assert.equal(request.body.includes(config.apiKey), false);
      return { ok: true, json: async () => envelope({ findings: [finding()] }) };
    },
  });
  const changedIds = finding();
  changedIds.id = 'another-model-id';
  changedIds.actions[0].id = 'another-action-id';
  const second = await analyze({ findings: [changedIds] });
  assert.equal(calls, 1);
  assert.equal(first.findings[0].id, second.findings[0].id);
  assert.equal(first.findings[0].actions[0].id, second.findings[0].actions[0].id);
  assert.deepEqual(first.usage, { input_tokens: 250, output_tokens: 120, total_tokens: 370 });
  assert.equal(first.model, config.deployment);
  assert.equal(first.attempts, 1);
  assert.ok(first.latencyMs >= 0);
});

test('an empty, completed analysis is distinct from a model failure', async () => {
  assert.deepEqual((await analyze({ findings: [] })).findings, []);
  let called = false;
  const result = await analyzeObservations([sources[0]], { config, fetchImpl: async () => { called = true; } });
  assert.equal(called, false);
  assert.deepEqual(result.findings, []);
  assert.equal(result.attempts, 0);
});

test('rejects hallucinated quotes and unknown source IDs', async () => {
  for (const mutate of [
    (item) => { item.evidence[0].quote = 'Confirmed invented facts'; },
    (item) => { item.evidence[0].sourceId = 'unknown'; },
    (item) => { item.evidence = [item.evidence[0], item.evidence[0]]; },
  ]) {
    const item = finding(); mutate(item);
    await rejectsCode(analyze({ findings: [item] }), 'MODEL_GROUNDING');
  }
});

test('rejects pending proposals, ambiguous targets, and stale source edits', async () => {
  const pending = finding(); pending.kind = 'pending';
  await rejectsCode(analyze({ findings: [pending] }), 'MODEL_ACTION');
  const repeated = structuredClone(sources); repeated[1].text += ' Also the third floor.';
  await rejectsCode(analyze({ findings: [finding()] }, {}, repeated), 'MODEL_ACTION');
  const outdated = structuredClone(sources); outdated[1].stale = true;
  await rejectsCode(analyze({ findings: [finding()] }, {}, outdated), 'MODEL_ACTION');
  const unconfirmed = finding(); unconfirmed.evidence[0].role = 'proposal';
  await rejectsCode(analyze({ findings: [unconfirmed] }), 'MODEL_ACTION');
});

test('a grounded pending finding may have no actions or one bounded Slack question', async () => {
  const pending = finding(); pending.kind = 'pending'; pending.evidence[0].role = 'proposal'; pending.actions = [];
  assert.equal((await analyze({ findings: [pending] })).findings[0].actions.length, 0);
  pending.actions = [{ id: 'ask', kind: 'slack_message', sourceId: sources[0].id,
    before: '', after: '', text: 'Can Alex confirm the Atlas demo venue for 18 September?', channelId: 'C1', threadTs: '123' }];
  assert.equal((await analyze({ findings: [pending] })).findings[0].actions[0].kind, 'slack_message');
  pending.actions[0].channelId = 'C-other';
  await rejectsCode(analyze({ findings: [pending] }), 'MODEL_ACTION');
  pending.actions[0].channelId = 'C1'; pending.actions[0].threadTs = 'different-thread';
  await rejectsCode(analyze({ findings: [pending] }), 'MODEL_ACTION');
});

test('rejects unknown actions, confidence errors, and additional response fields', async () => {
  const unknown = finding(); unknown.actions[0].kind = 'send_email';
  await rejectsCode(analyze({ findings: [unknown] }), 'MODEL_FORMAT');
  const confidence = finding(); confidence.confidence = 2;
  await rejectsCode(analyze({ findings: [confidence] }), 'MODEL_FORMAT');
  await rejectsCode(analyze({ findings: [], hiddenInstructions: 'extra' }), 'MODEL_FORMAT');
});

test('provider errors, malformed JSON, and refusals never leak response content', async () => {
  await rejectsCode(analyze(null, { fetchImpl: async () => ({ ok: false, status: 401,
    json: async () => { throw new Error(config.apiKey); } }) }), 'MODEL_HTTP');
  await rejectsCode(analyze(null, { fetchImpl: async () => { throw new Error(config.apiKey); } }), 'MODEL_TRANSPORT');
  for (const [payload, code] of [
    [{ status: 'incomplete', output: [] }, 'MODEL_INCOMPLETE'],
    [{ status: 'completed', output: [] }, 'MODEL_FORMAT'],
    [{ status: 'completed', output: [null, { type: 'message', role: 'assistant', content: [null] }] }, 'MODEL_FORMAT'],
    [{ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: config.apiKey }] }] }, 'MODEL_REFUSAL'],
    [{ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '{bad' }] }] }, 'MODEL_FORMAT'],
  ]) await rejectsCode(analyze(null, { fetchImpl: async () => ({ ok: true, json: async () => payload }) }), code);
});

test('supports cancellation without making a request', async () => {
  const controller = new AbortController(); controller.abort('sensitive reason');
  let called = false;
  await rejectsCode(analyze(null, { signal: controller.signal, fetchImpl: async () => { called = true; } }), 'MODEL_CANCELLED');
  assert.equal(called, false);
});

test('times out the model request and sanitizes the transport error', async () => {
  await rejectsCode(analyze(null, { timeoutMs: 10, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
    const keepAlive = setTimeout(() => reject(new Error('unexpected timeout')), 1000);
    signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(new Error(config.apiKey)); }, { once: true });
  }) }), 'MODEL_TIMEOUT');
});

test('validates credentials configuration, input identity, and size before transport', async () => {
  await rejectsCode(analyze({}, { config: {} }), 'MODEL_UNCONFIGURED');
  await rejectsCode(analyze({}, { config: { ...config, baseUrl: 'http://synthetic.test/openai/v1' } }), 'MODEL_CONFIG');
  await rejectsCode(analyze({}, { config: { ...config, baseUrl: 'https://synthetic.test/openai/v1?key=secret' } }), 'MODEL_CONFIG');
  await rejectsCode(analyze({}, {}, [sources[0], sources[0]]), 'INVALID_INPUT');
  const large = structuredClone(sources); large[1].text = 'x'.repeat(50_001);
  await rejectsCode(analyze({}, {}, large), 'INPUT_LIMIT');
});

function rejectWhenAborted(signal) {
  return new Promise((_resolve, reject) => {
    const keepAlive = setTimeout(() => reject(new Error('Unexpected test timeout.')), 1_000);
    signal.addEventListener('abort', () => {
      clearTimeout(keepAlive);
      reject(new Error(config.apiKey));
    }, { once: true });
  });
}

test('retries a timed-out analysis once and includes the first attempt and backoff in latency', async () => {
  let calls = 0;
  const result = await analyze(null, { timeoutMs: 10, retryDelayMs: 20,
    fetchImpl: async (_url, { signal }) => {
      calls += 1;
      if (calls === 1) return rejectWhenAborted(signal);
      assert.equal(signal.aborted, false);
      return { ok: true, json: async () => envelope({ findings: [finding()] }) };
    } });
  assert.equal(calls, 2);
  assert.equal(result.attempts, 2);
  assert.equal(result.findings.length, 1);
  assert.ok(result.latencyMs >= 20);
});

test('retries transport failure once without changing the read-only request', async () => {
  const bodies = [];
  const result = await analyze(null, { fetchImpl: async (_url, request) => {
    bodies.push(request.body);
    if (bodies.length === 1) throw new Error(config.apiKey);
    return { ok: true, json: async () => envelope({ findings: [] }) };
  } });
  assert.equal(result.attempts, 2);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
  assert.equal(JSON.parse(bodies[0]).tools, undefined);
});

test('two failed attempts expose the sanitized failure and never call a third time', async () => {
  for (const code of ['MODEL_TIMEOUT', 'MODEL_TRANSPORT']) {
    let calls = 0;
    await rejectsCode(analyze(null, { timeoutMs: 10, fetchImpl: async (_url, { signal }) => {
      calls += 1;
      if (code === 'MODEL_TIMEOUT') return rejectWhenAborted(signal);
      throw new Error(config.apiKey);
    } }), code);
    assert.equal(calls, 2);
  }
});

test('cancelling during retry backoff prevents the second provider call', async () => {
  const controller = new AbortController();
  let calls = 0;
  await rejectsCode(analyze(null, { signal: controller.signal, retryDelayMs: 200,
    fetchImpl: async () => {
      calls += 1;
      setTimeout(() => controller.abort('sensitive cancellation reason'), 10);
      throw new Error(config.apiKey);
    } }), 'MODEL_CANCELLED');
  assert.equal(calls, 1);
});

test('refusal, validation, incomplete output and HTTP failures never retry', async () => {
  const ungrounded = finding(); ungrounded.evidence[0].quote = 'Invented evidence.';
  const unsafe = finding(); unsafe.kind = 'pending';
  const cases = [
    { code: 'MODEL_REFUSAL', payload: { status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal' }] }] } },
    { code: 'MODEL_FORMAT', payload: envelope({ findings: [], extra: 'unexpected' }) },
    { code: 'MODEL_GROUNDING', payload: envelope({ findings: [ungrounded] }) },
    { code: 'MODEL_ACTION', payload: envelope({ findings: [unsafe] }) },
    { code: 'MODEL_INCOMPLETE', payload: { status: 'incomplete', output: [] } },
    { code: 'MODEL_HTTP', status: 401 },
    { code: 'MODEL_HTTP', status: 429 },
  ];
  for (const scenario of cases) {
    let calls = 0;
    await rejectsCode(analyze(null, { fetchImpl: async () => {
      calls += 1;
      return { ok: !scenario.status, status: scenario.status || 200, json: async () => scenario.payload };
    } }), scenario.code);
    assert.equal(calls, 1, scenario.code);
  }
  let calls = 0;
  await rejectsCode(analyze(null, { config: {}, fetchImpl: async () => { calls += 1; } }), 'MODEL_UNCONFIGURED');
  assert.equal(calls, 0);
});

test('retry delay injection is bounded before any request', async () => {
  for (const retryDelayMs of [-1, 5_001, 0.5]) {
    let calls = 0;
    await rejectsCode(analyze(null, { retryDelayMs, fetchImpl: async () => { calls += 1; } }), 'MODEL_CONFIG');
    assert.equal(calls, 0);
  }
});
