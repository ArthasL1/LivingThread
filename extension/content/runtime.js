(() => {
  if (globalThis.LivingThread) return;
  let state = { connected: false, session: { enabled: false }, findings: [], observations: [], operations: [] };
  const listeners = new Set();
  const handlers = [];
  let adapter;
  let scanning = false;
  const send = async (message) => {
    try {
      const result = await chrome.runtime.sendMessage(message);
      if (result?.error && !result.session) throw new Error(result.error);
      return result;
    } catch (error) {
      throw new Error(error.message.includes('context invalidated') ? 'Refresh this page after reloading LivingThread.' : error.message);
    }
  };
  const update = value => {
    state = value;
    for (const listener of listeners) { try { listener(state); } catch (error) { console.warn('LivingThread UI:', error.message); } }
  };
  const scan = async () => {
    if (!state.session?.enabled || scanning || !adapter) return;
    scanning = true;
    try {
      const activeIds = await adapter.scan();
      if (Array.isArray(activeIds)) await send({ type: 'presence', activeIds });
    } catch (error) { await send({ type: 'diagnostic', data: { app: adapter.app, message: error.message, url: location.href } }).catch(() => {}); }
    finally { scanning = false; }
  };
  globalThis.LivingThread = {
    observe: observation => send({ type: 'observe', observation: { ...observation, observedAt: new Date().toISOString() } }),
    onAction: handler => handlers.push(handler),
    registerAdapter: value => { adapter = value; scan(); },
    getState: () => state,
    onState: callback => { listeners.add(callback); callback(state); return () => listeners.delete(callback); },
    approve: (findingId, actionIds) => send({ type: 'approve', findingId, actionIds }),
    clarify: (findingId, text) => send({ type: 'clarify', findingId, text }),
    dismiss: findingId => send({ type: 'dismiss', findingId }),
    report: data => send({ type: 'diagnostic', data: { ...data, url: location.href } }),
    request: send,
    rescan: scan
  };
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type === 'state') { update(message.state); scan(); }
    if (message.type === 'scan') { scan().then(() => respond({ ok: true })); return true; }
    if (message.type === 'action') {
      (async () => {
        if (!state.session?.enabled) return { ok: false, message: 'The work session is paused.' };
        for (const handler of handlers) { const result = await handler(message.action); if (result) return result; }
        return { ok: false, message: 'No supported editor is available for this action.' };
      })().then(respond, error => respond({ ok: false, message: error.message }));
      return true;
    }
  });
  async function poll() {
    try { const result = await send({ type: 'state' }); if (result) update(result); }
    catch (error) { update({ ...state, connected: false, error: error.message }); }
    await scan();
  }
  setInterval(poll, 2500);
  poll();
})();
