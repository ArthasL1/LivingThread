// Slack access belongs to the running LivingThread service, never to a development connector.
const API_ORIGIN = 'https://slack.com/api/';
const HISTORY_LIMIT = 15;
const MAX_MESSAGES = 1500;
const MAX_SENDS = 1000;
const CHANNEL_RE = /^[CG][A-Z0-9]{5,}$/;
const TS_RE = /^\d{9,}\.[0-9]{1,6}$/;
const FATAL_AUTH = new Set(['invalid_auth', 'not_authed', 'token_revoked', 'token_expired', 'account_inactive', 'not_allowed_token_type', 'missing_scope']);
const UNCERTAIN_ERRORS = new Set(['internal_error', 'fatal_error', 'service_unavailable', 'request_timeout']);

function safeCode(value, fallback = 'api_error') {
  return typeof value === 'string' && /^[a-z_]{1,60}$/.test(value) ? value : fallback;
}

function timestampValue(value) {
  if (!TS_RE.test(value || '')) return 0n;
  const [seconds, micros] = value.split('.');
  return BigInt(seconds) * 1000000n + BigInt(micros.padEnd(6, '0'));
}

function slackUrl(teamId, channelId, ts, threadTs = '') {
  const url = new URL(`https://app.slack.com/client/${teamId}/${channelId}`);
  url.searchParams.set('message_ts', ts);
  if (threadTs) url.searchParams.set('thread_ts', threadTs);
  return url.href;
}

class SlackError extends Error {
  constructor(code, { uncertain = false, retryAfter = 0 } = {}) {
    super(`Slack: ${code}.`);
    this.code = code;
    this.uncertain = uncertain;
    this.retryAfter = retryAfter;
  }
}

/**
 * Observation callbacks receive message tombstones (empty text, context.deleted=true).
 * The owner must invalidate their prior evidence and mark cached sources stale when disconnected.
 * postMessage must only be invoked by the owner's exact, reviewed approval route.
 */
export function createSlackAdapter({
  botToken = '', appToken = '', channelIds = [], onObservation = () => {}, onStatus = () => {},
  fetchImpl = globalThis.fetch, WebSocketImpl = globalThis.WebSocket,
} = {}) {
  const channels = [...new Set((Array.isArray(channelIds) ? channelIds : [])
    .filter(value => typeof value === 'string').map(value => value.trim()).filter(Boolean))];
  const allowedChannels = new Set(channels);
  const configured = Boolean(botToken && appToken && channels.length && channels.every(id => CHANNEL_RE.test(id)));
  let status = {
    state: configured ? 'stopped' : 'unconfigured', configured, connected: false,
    message: configured ? 'Slack is configured and stopped.' : 'Add Slack bot/app tokens and at least one valid channel ID.',
    teamId: '', botUserId: '', channelIds: channels, coverage: 'partial', coverageGap: false,
    history: {}, updatedAt: new Date().toISOString(),
  };
  let running = false;
  let generation = 0;
  let socket = null;
  let reconnectTimer = null;
  let connectionTimer = null;
  let reconnectAttempts = 0;
  let startPromise = null;
  let eventQueue = Promise.resolve();
  const controllers = new Set();
  const seenEnvelopes = new Map();
  const seenEvents = new Map();
  const messages = new Map();
  // Never evict an uncertain write and silently permit its identifier to be reused.
  const sends = new Map();

  function getStatus() { return structuredClone(status); }

  function update(next) {
    status = { ...status, ...next, updatedAt: new Date().toISOString() };
    try { Promise.resolve(onStatus(getStatus())).catch(() => {}); } catch { /* A UI callback must not crash a socket. */ }
  }

  async function api(method, token, body = {}, { write = false } = {}) {
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 15000);
    timer.unref?.();
    try {
      const response = await fetchImpl(`${API_ORIGIN}${method}`, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const retryAfter = Math.max(0, Number(response.headers?.get?.('retry-after')) || 0);
        throw new SlackError(response.status === 429 ? 'rate_limited' : `http_${response.status}`, {
          uncertain: write && response.status >= 500, retryAfter,
        });
      }
      let data;
      try { data = await response.json(); }
      catch { throw new SlackError('invalid_response', { uncertain: write }); }
      if (!data || typeof data.ok !== 'boolean') throw new SlackError('invalid_response', { uncertain: write });
      if (!data.ok) {
        const code = safeCode(data.error);
        throw new SlackError(code, { uncertain: write && UNCERTAIN_ERRORS.has(code) });
      }
      return data;
    } catch (error) {
      if (error instanceof SlackError) throw error;
      // Do not leak fetch errors: they can contain headers, tokens, or the socket ticket.
      throw new SlackError(controller.signal.aborted ? 'request_aborted' : 'network_error', { uncertain: write });
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }

  function remember(map, key) {
    if (!key) return false;
    if (map.has(key)) return true;
    map.set(key, true);
    if (map.size > 2000) map.delete(map.keys().next().value);
    return false;
  }

  async function observeMessage(channelId, message, { revision, deleted = false, origin = 'event' } = {}) {
    if (!allowedChannels.has(channelId) || !TS_RE.test(message?.ts || '')) return;
    const ts = message.ts;
    const id = `slack:${status.teamId}:${channelId}:${ts}`;
    const previous = messages.get(id);
    const versionTs = revision || message.edited?.ts || ts;
    if (previous && timestampValue(versionTs) < timestampValue(previous.revision)) return;
    // A deleted message cannot be resurrected by late history or an older envelope.
    if (previous?.deleted && !deleted) return;
    const text = deleted ? '' : typeof message.text === 'string' ? message.text : '';
    if (!deleted && !text.trim() && !previous) return;
    const threadTs = TS_RE.test(message.thread_ts || '') ? message.thread_ts : previous?.threadTs || ts;
    if (previous && previous.text === text && previous.deleted === deleted && previous.threadTs === threadTs) {
      previous.revision = versionTs;
      return;
    }
    const record = { revision: versionTs, text, deleted, threadTs };
    messages.set(id, record);
    if (messages.size > MAX_MESSAGES) messages.delete(messages.keys().next().value);
    const observation = {
      id, app: 'slack', resourceId: `${status.teamId}/${channelId}/${ts}`,
      url: slackUrl(status.teamId, channelId, ts, threadTs),
      title: `Slack · ${channelId} · ${threadTs === ts ? 'message' : 'thread reply'}`,
      text, observedAt: new Date().toISOString(), coverage: 'partial', editable: false,
      account: status.teamId,
      context: {
        channelId, threadTs, messageTs: ts, userId: message.user || '',
        botId: message.bot_id || '', deleted, editedAt: message.edited?.ts || '',
        sourceUpdatedAt: versionTs, origin,
        historyLimit: HISTORY_LIMIT, threadHistoryComplete: false,
      },
    };
    try { await onObservation(observation); }
    catch {
      // Permit a later refresh to redeliver if the owner failed to ingest this source.
      if (messages.get(id) === record) messages.delete(id);
      update({ message: 'Slack observation could not be stored; coverage may be incomplete.', coverageGap: true });
    }
  }

  async function refreshHistory(currentGeneration) {
    for (const channelId of channels) {
      if (!running || currentGeneration !== generation) return;
      try {
        const result = await api('conversations.history', botToken, { channel: channelId, limit: HISTORY_LIMIT });
        if (!running || currentGeneration !== generation) return;
        const recent = Array.isArray(result.messages) ? result.messages : [];
        for (const message of [...recent].reverse()) {
          if (!running || currentGeneration !== generation) return;
          if (message.type && message.type !== 'message') continue;
          if (message.subtype && !['bot_message', 'thread_broadcast', 'file_share'].includes(message.subtype)) continue;
          await observeMessage(channelId, message, { origin: 'history' });
        }
        update({ history: { ...status.history, [channelId]: { ok: true, count: recent.length, observedAt: new Date().toISOString(), coverage: 'partial' } } });
      } catch (error) {
        if (!running || currentGeneration !== generation) return;
        update({
          history: { ...status.history, [channelId]: { ok: false, code: safeCode(error.code), coverage: 'partial' } },
          message: `Slack is connected, but recent history for ${channelId} was not retrieved (${safeCode(error.code)}).`,
          coverageGap: true,
        });
        // Do not continue issuing history calls during a method-wide rate limit.
        if (error.code === 'rate_limited') return;
      }
    }
  }

  function dropSocket() {
    clearTimeout(connectionTimer);
    connectionTimer = null;
    const old = socket;
    socket = null;
    try { old?.close(); } catch { /* Already closed. */ }
  }

  function reconnect(message, delayMs) {
    if (!running || reconnectTimer) return;
    dropSocket();
    update({ state: 'reconnecting', connected: false, coverageGap: true, message });
    const delay = delayMs ?? Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempts++, 5));
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (running) void connect(generation);
    }, Math.max(250, delay));
    reconnectTimer.unref?.();
  }

  async function handleEnvelope(envelope, sourceSocket, currentGeneration) {
    if (!running || generation !== currentGeneration || sourceSocket !== socket) return;
    if (envelope.type === 'hello') {
      reconnectAttempts = 0;
      clearTimeout(connectionTimer);
      update({ state: 'connected', connected: true, message: 'Slack events are connected. Recent context is bounded; older thread replies are not backfilled.' });
      void refreshHistory(currentGeneration);
      return;
    }
    if (envelope.type === 'disconnect') {
      if (envelope.reason === 'link_disabled') {
        running = false;
        dropSocket();
        update({ state: 'error', connected: false, coverageGap: true, message: 'Slack Socket Mode was disabled. Enable it before restarting.' });
      } else reconnect('Slack is refreshing its event connection.', 250);
      return;
    }
    if (envelope.type !== 'events_api') return;
    const payload = envelope.payload;
    if (payload?.team_id && payload.team_id !== status.teamId) return;
    if (remember(seenEvents, payload?.event_id)) return;
    const event = payload?.event;
    if (event?.type !== 'message' || !allowedChannels.has(event.channel)) return;
    if (event.subtype === 'message_deleted') {
      const ts = event.deleted_ts || event.previous_message?.ts;
      await observeMessage(event.channel, { ...event.previous_message, ts }, {
        deleted: true, revision: event.event_ts || event.ts || ts,
      });
    } else if (event.subtype === 'message_changed') {
      await observeMessage(event.channel, event.message, {
        revision: event.message?.edited?.ts || event.event_ts || event.ts,
      });
    } else if (!event.subtype || ['bot_message', 'thread_broadcast', 'file_share'].includes(event.subtype)) {
      await observeMessage(event.channel, event, { revision: event.edited?.ts || event.ts });
    }
  }

  async function connect(currentGeneration) {
    try {
      const result = await api('apps.connections.open', appToken);
      if (!running || currentGeneration !== generation) return;
      let url;
      try { url = new URL(result.url); } catch { throw new SlackError('invalid_socket_url'); }
      if (url.protocol !== 'wss:' || !(url.hostname === 'slack.com' || url.hostname.endsWith('.slack.com')) || url.username || url.password) {
        throw new SlackError('invalid_socket_url');
      }
      const ws = new WebSocketImpl(url.href);
      socket = ws;
      connectionTimer = setTimeout(() => {
        if (socket === ws) reconnect('Slack event connection timed out. Reconnecting.');
      }, 15000);
      connectionTimer.unref?.();
      ws.addEventListener('message', event => {
        if (socket !== ws || !running || generation !== currentGeneration) return;
        let envelope;
        try { envelope = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString()); }
        catch { update({ coverageGap: true, message: 'Slack sent an unreadable event; it was ignored.' }); return; }
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return;
        // Acknowledge immediately, including retries and events outside our observation scope.
        if (typeof envelope.envelope_id === 'string') {
          try { ws.send(JSON.stringify({ envelope_id: envelope.envelope_id })); }
          catch { reconnect('Slack event acknowledgement failed. Reconnecting.'); return; }
          if (remember(seenEnvelopes, envelope.envelope_id)) return;
        }
        eventQueue = eventQueue.then(() => handleEnvelope(envelope, ws, currentGeneration))
          .catch(() => update({ coverageGap: true, message: 'A Slack event could not be processed.' }));
      });
      ws.addEventListener('close', () => { if (socket === ws) reconnect('Slack event connection closed. Reconnecting.'); });
      ws.addEventListener('error', () => { if (socket === ws) reconnect('Slack event connection failed. Reconnecting.'); });
    } catch (error) {
      if (!running || currentGeneration !== generation) return;
      if (FATAL_AUTH.has(error.code) || error.code === 'invalid_socket_url') {
        running = false;
        update({ state: 'error', connected: false, message: `Slack connection failed (${safeCode(error.code)}). Check app configuration.` });
      } else reconnect(`Slack connection is unavailable (${safeCode(error.code)}). Retrying connection only.`, error.retryAfter ? error.retryAfter * 1000 : undefined);
    }
  }

  async function start() {
    if (!configured) { update({ state: 'unconfigured' }); return getStatus(); }
    if (running) return startPromise ? startPromise : getStatus();
    if (typeof fetchImpl !== 'function' || typeof WebSocketImpl !== 'function') {
      update({ state: 'error', message: 'This runtime requires native fetch and WebSocket (Node 22+).' });
      return getStatus();
    }
    running = true;
    const currentGeneration = ++generation;
    update({ state: 'connecting', connected: false, message: 'Checking Slack identity and opening the event connection.' });
    startPromise = (async () => {
      try {
        const identity = await api('auth.test', botToken);
        if (!running || currentGeneration !== generation) return getStatus();
        if (!/^T[A-Z0-9]+$/.test(identity.team_id || '') || !/^U[A-Z0-9]+$/.test(identity.user_id || '') || !identity.bot_id) {
          throw new SlackError('bot_identity_required');
        }
        update({ teamId: identity.team_id, botUserId: identity.user_id });
        await connect(currentGeneration);
      } catch (error) {
        if (currentGeneration === generation && running) {
          running = false;
          update({ state: 'error', connected: false, message: `Slack identity check failed (${safeCode(error.code)}). Check bot configuration and restart.` });
        }
      }
      return getStatus();
    })();
    try { return await startPromise; } finally { startPromise = null; }
  }

  function stop() {
    running = false;
    generation += 1;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
    dropSocket();
    for (const controller of controllers) controller.abort();
    update({ state: configured ? 'stopped' : 'unconfigured', connected: false, message: 'Slack observation is stopped. Cached evidence is not live.' });
    return getStatus();
  }

  async function postMessage({ channelId, threadTs = '', text, clientMsgId } = {}) {
    const base = { ok: false, status: 'failed', channelId: channelId || '', threadTs, ts: '', url: '', clientMsgId: clientMsgId || '' };
    if (!configured || !running || !status.connected) return { ...base, message: 'Slack must be configured and connected before posting.' };
    if (!allowedChannels.has(channelId)) return { ...base, message: 'This Slack channel is outside the authorized session.' };
    if (threadTs && !TS_RE.test(threadTs)) return { ...base, message: 'The Slack parent thread timestamp is invalid.' };
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) return { ...base, message: 'Slack message text must contain 1–4,000 characters.' };
    if (typeof clientMsgId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(clientMsgId)) {
      return { ...base, message: 'Provide a stable operation identifier before posting.' };
    }
    const fingerprint = JSON.stringify([channelId, threadTs, text]);
    const existing = sends.get(clientMsgId);
    if (existing) {
      if (existing.fingerprint !== fingerprint) return { ...base, message: 'This operation identifier was already used for different content or a different destination.' };
      return { ...await existing.promise, deduplicated: true };
    }
    if (sends.size >= MAX_SENDS) return { ...base, message: 'The session write ledger is full. No message was sent.' };
    const promise = (async () => {
      try {
        const body = {
          channel: channelId, text, client_msg_id: clientMsgId,
          mrkdwn: false, parse: 'none', link_names: false,
          unfurl_links: false, unfurl_media: false, reply_broadcast: false,
        };
        if (threadTs) body.thread_ts = threadTs;
        const result = await api('chat.postMessage', botToken, body, { write: true });
        if (result.channel !== channelId || !TS_RE.test(result.ts || '')) {
          throw new SlackError('unverified_response', { uncertain: true });
        }
        const returnedText = result.message?.text;
        const resultThread = result.message?.thread_ts || '';
        if (typeof returnedText !== 'string' || (threadTs && resultThread !== threadTs)) {
          return { ...base, status: 'uncertain', ts: result.ts, url: slackUrl(status.teamId, channelId, result.ts, threadTs),
            message: 'Slack accepted the message, but its returned content or thread could not be verified. Inspect Slack before taking further action.' };
        }
        await observeMessage(channelId, { ...result.message, ts: result.ts, user: result.message.user || status.botUserId }, { origin: 'approved_post' });
        return { ...base, ok: true, status: 'succeeded', ts: result.ts, url: slackUrl(status.teamId, channelId, result.ts, threadTs),
          actualText: returnedText, message: returnedText === text ? 'Slack confirmed the message was posted.' : 'Slack confirmed the message was posted; inspect the returned text because Slack normalized its formatting.' };
      } catch (error) {
        return { ...base, status: error.uncertain ? 'uncertain' : 'failed',
          retryAfter: error.retryAfter || 0,
          message: error.uncertain
            ? 'Slack delivery is uncertain. This operation will not be resent automatically; inspect the target conversation first.'
            : `Slack did not accept the message (${safeCode(error.code)}). No automatic retry was attempted.`,
        };
      }
    })();
    sends.set(clientMsgId, { fingerprint, promise });
    return promise;
  }

  return { start, stop, getStatus, postMessage };
}
