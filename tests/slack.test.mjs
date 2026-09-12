import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlackAdapter } from '../server/slack.mjs';

const CHANNEL = 'C12345678';
const TS = '1800000000.000001';
const tick = () => new Promise(resolve => setImmediate(resolve));
const json = data => ({ ok: true, status: 200, headers: new Headers(), json: async () => data });

function fixture({ history = [], historyError, send, onObservation } = {}) {
  const calls = [];
  const observations = [];
  const sockets = [];
  class FakeWebSocket extends EventTarget {
    constructor(url) { super(); this.url = url; this.sent = []; this.closed = false; sockets.push(this); }
    send(text) { this.sent.push(JSON.parse(text)); }
    close() { this.closed = true; this.dispatchEvent(new Event('close')); }
    receive(data) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })); }
  }
  const adapter = createSlackAdapter({
    botToken: 'synthetic-bot-token', appToken: 'synthetic-app-token', channelIds: [CHANNEL],
    WebSocketImpl: FakeWebSocket,
    onObservation: async observation => { observations.push(observation); await onObservation?.(observation); },
    fetchImpl: async (url, options) => {
      const method = url.split('/').at(-1);
      calls.push({ method, body: JSON.parse(options.body), options });
      if (method === 'auth.test') return json({ ok: true, team_id: 'T12345678', user_id: 'U12345678', bot_id: 'B12345678' });
      if (method === 'apps.connections.open') return json({ ok: true, url: 'wss://wss.slack.com/link/?ticket=synthetic' });
      if (method === 'conversations.history') return json(historyError ? { ok: false, error: historyError } : { ok: true, messages: history });
      if (method === 'chat.postMessage') return send ? send(JSON.parse(options.body)) : json({
        ok: true, channel: CHANNEL, ts: '1800000002.000001', message: { text: JSON.parse(options.body).text, thread_ts: JSON.parse(options.body).thread_ts },
      });
      throw new Error('Unexpected API call');
    },
  });
  async function ready() {
    await adapter.start();
    sockets.at(-1).receive({ type: 'hello' });
    await tick(); await tick();
  }
  async function event(event, { id = `evt-${Math.random()}`, team = 'T12345678' } = {}) {
    sockets.at(-1).receive({ type: 'events_api', envelope_id: id, payload: { team_id: team, event_id: id, event } });
    await tick();
  }
  return { adapter, calls, observations, sockets, ready, event };
}

test('missing credentials remain unconfigured and do not issue requests', async () => {
  let requests = 0;
  const adapter = createSlackAdapter({ fetchImpl: async () => { requests++; } });
  assert.equal((await adapter.start()).state, 'unconfigured');
  assert.equal((await adapter.postMessage({ channelId: CHANNEL, text: 'Test', clientMsgId: 'a' })).ok, false);
  assert.equal(requests, 0);
  adapter.stop();
});

test('initial history is channel-scoped, bounded and explicitly partial', async t => {
  const f = fixture({ history: [{ type: 'message', ts: TS, text: 'Atlas is on the third floor.', user: 'U99999999' }] });
  t.after(() => f.adapter.stop());
  await f.ready();
  assert.equal(f.adapter.getStatus().state, 'connected');
  assert.equal(f.observations.length, 1);
  assert.equal(f.observations[0].id, `slack:T12345678:${CHANNEL}:${TS}`);
  assert.equal(f.observations[0].context.threadTs, TS);
  assert.equal(f.observations[0].coverage, 'partial');
  assert.equal(f.observations[0].editable, false);
  assert.equal(new URL(f.observations[0].url).searchParams.get('message_ts'), TS);
  assert.deepEqual(f.calls.find(call => call.method === 'conversations.history').body, { channel: CHANNEL, limit: 15 });
  assert.equal(f.calls.some(call => call.method === 'chat.postMessage'), false);
});

test('acknowledges scoped-out events and deduplicates retries without collecting other channels', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  const message = { type: 'message', channel: CHANNEL, ts: TS, text: 'A room change.' };
  await f.event({ ...message, channel: 'C99999999' }, { id: 'outside' });
  await f.event(message, { id: 'allowed' });
  await f.event(message, { id: 'allowed' });
  await f.event({ ...message, text: 'Different workspace' }, { id: 'other-team', team: 'T99999999' });
  assert.equal(f.observations.length, 1);
  assert.deepEqual(f.sockets[0].sent.map(value => value.envelope_id), ['outside', 'allowed', 'allowed', 'other-team']);
});

test('edits retain stable identity, older edits cannot overwrite, and deletions remove current text', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  await f.event({ type: 'message', channel: CHANNEL, ts: TS, text: 'Third floor' });
  await f.event({ type: 'message', subtype: 'message_changed', channel: CHANNEL,
    message: { ts: TS, text: 'Fifth floor', edited: { ts: '1800000005.000001' } } });
  await f.event({ type: 'message', subtype: 'message_changed', channel: CHANNEL,
    message: { ts: TS, text: 'Fourth floor', edited: { ts: '1800000003.000001' } } });
  await f.event({ type: 'message', subtype: 'message_deleted', channel: CHANNEL, deleted_ts: TS, event_ts: '1800000006.000001' });
  await f.event({ type: 'message', channel: CHANNEL, ts: TS, text: 'Late stale original' });
  assert.deepEqual(f.observations.map(value => value.text), ['Third floor', 'Fifth floor', '']);
  assert.equal(new Set(f.observations.map(value => value.id)).size, 1);
  assert.equal(f.observations.at(-1).context.deleted, true);
});

test('replies preserve their parent identity without pretending to have complete thread history', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  await f.event({ type: 'message', channel: CHANNEL, ts: '1800000001.000001', thread_ts: TS, text: 'Confirmed, Room 502.' });
  assert.equal(f.observations[0].context.threadTs, TS);
  assert.equal(f.observations[0].context.messageTs, '1800000001.000001');
  assert.equal(f.observations[0].context.threadHistoryComplete, false);
});

test('removing all message text invalidates the prior observation, and no-op edits advance ordering', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  await f.event({ type: 'message', channel: CHANNEL, ts: TS, text: 'Original text' });
  await f.event({ type: 'message', subtype: 'message_changed', channel: CHANNEL,
    message: { ts: TS, text: 'Original text', edited: { ts: '1800000005.000001' } } });
  await f.event({ type: 'message', subtype: 'message_changed', channel: CHANNEL,
    message: { ts: TS, text: 'Older update', edited: { ts: '1800000003.000001' } } });
  await f.event({ type: 'message', subtype: 'message_changed', channel: CHANNEL,
    message: { ts: TS, text: '', edited: { ts: '1800000006.000001' } } });
  assert.deepEqual(f.observations.map(value => value.text), ['Original text', '']);
});

test('history denial is visible while events remain connected', async t => {
  const f = fixture({ historyError: 'not_in_channel' }); t.after(() => f.adapter.stop()); await f.ready();
  assert.equal(f.adapter.getStatus().connected, true);
  assert.equal(f.adapter.getStatus().history[CHANNEL].ok, false);
  assert.equal(f.adapter.getStatus().history[CHANNEL].code, 'not_in_channel');
  assert.equal(f.adapter.getStatus().coverageGap, true);
});

test('approved posts enforce destination and stable identifiers; duplicate calls send exactly once', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  assert.equal((await f.adapter.postMessage({ channelId: 'C99999999', text: 'No', clientMsgId: 'x' })).ok, false);
  assert.equal((await f.adapter.postMessage({ channelId: CHANNEL, text: 'No' })).ok, false);
  const action = { channelId: CHANNEL, threadTs: TS, text: 'Can you confirm the venue?', clientMsgId: 'reviewed-operation-1' };
  const [one, two] = await Promise.all([f.adapter.postMessage(action), f.adapter.postMessage(action)]);
  assert.equal(one.status, 'succeeded');
  assert.equal(two.deduplicated, true);
  assert.equal(f.calls.filter(call => call.method === 'chat.postMessage').length, 1);
  const sentBody = f.calls.find(call => call.method === 'chat.postMessage').body;
  assert.equal(sentBody.thread_ts, TS);
  assert.equal(sentBody.reply_broadcast, false);
  assert.equal(sentBody.unfurl_links, false);
  assert.equal((await f.adapter.postMessage({ ...action, text: 'Changed after approval' })).ok, false);
  assert.equal(f.calls.filter(call => call.method === 'chat.postMessage').length, 1);
});

test('uncertain transport failures are retained and never blindly retried', async t => {
  const f = fixture({ send: async () => { throw new Error('secret synthetic-bot-token must not escape'); } });
  t.after(() => f.adapter.stop()); await f.ready();
  const action = { channelId: CHANNEL, text: 'Reviewed update', clientMsgId: 'uncertain-1' };
  const first = await f.adapter.postMessage(action);
  const second = await f.adapter.postMessage(action);
  assert.equal(first.status, 'uncertain');
  assert.equal(second.status, 'uncertain');
  assert.equal(second.deduplicated, true);
  assert.equal(JSON.stringify(first).includes('synthetic-bot-token'), false);
  assert.equal(f.calls.filter(call => call.method === 'chat.postMessage').length, 1);
});

test('HTTP 5xx and Slack internal_error produce uncertain delivery, rate limits are explicit failures', async t => {
  for (const [response, expected] of [
    [{ ok: false, status: 503, headers: new Headers() }, 'uncertain'],
    [json({ ok: false, error: 'internal_error' }), 'uncertain'],
    [{ ok: false, status: 429, headers: new Headers({ 'retry-after': '30' }) }, 'failed'],
  ]) {
    const f = fixture({ send: async () => response }); t.after(() => f.adapter.stop()); await f.ready();
    const result = await f.adapter.postMessage({ channelId: CHANNEL, text: 'Update', clientMsgId: 'reviewed' });
    assert.equal(result.status, expected);
    if (response.status === 429) assert.equal(result.retryAfter, 30);
  }
});

test('unverified successful response is uncertain instead of claiming a saved result', async t => {
  const f = fixture({ send: async () => json({ ok: true, channel: CHANNEL, ts: '1800000009.000001' }) });
  t.after(() => f.adapter.stop()); await f.ready();
  const result = await f.adapter.postMessage({ channelId: CHANNEL, text: 'Update', clientMsgId: 'reviewed' });
  assert.equal(result.ok, false);
  assert.equal(result.status, 'uncertain');
});

test('refresh requests reconnect; stop cancels connection work and marks cached evidence non-live', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  f.sockets[0].receive({ type: 'disconnect', reason: 'refresh_requested' });
  await tick();
  assert.equal(f.adapter.getStatus().state, 'reconnecting');
  assert.equal(f.adapter.getStatus().connected, false);
  assert.equal(f.adapter.getStatus().coverageGap, true);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(f.sockets.length, 2);
  f.sockets[1].receive({ type: 'hello' }); await tick();
  assert.equal(f.adapter.getStatus().state, 'connected');
  f.adapter.stop();
  await f.event({ type: 'message', channel: CHANNEL, ts: TS, text: 'Must not ingest after stop' });
  assert.equal(f.observations.length, 0);
  assert.equal(f.adapter.getStatus().state, 'stopped');
});

test('disabled Socket Mode and malformed envelopes do not crash or trigger endless reconnects', async t => {
  const f = fixture(); t.after(() => f.adapter.stop()); await f.ready();
  f.sockets[0].receive(null); f.sockets[0].receive([]);
  f.sockets[0].receive({ type: 'disconnect', reason: 'link_disabled' }); await tick();
  assert.equal(f.adapter.getStatus().state, 'error');
  assert.equal(f.sockets[0].closed, true);
});
