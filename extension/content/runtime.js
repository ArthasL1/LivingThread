(() => {
  if (globalThis.LivingThread) return;
  let state = { connected: false, session: { enabled: false }, findings: [], observations: [], operations: [] };
  const listeners = new Set();
  const handlers = [];
  // Keep receipts returned by this page's own approvals while a background poll
  // catches up. A Slack-only action may finish inside the approval request itself.
  const approvalReceipts = new Map();
  const terminal = operation => ['succeeded', 'failed', 'uncertain'].includes(operation?.status);
  const newerOperation = (previous, incoming) => {
    if (!previous) return incoming;
    if (terminal(previous) && !terminal(incoming)) return previous;
    const previousTime = Date.parse(previous.finishedAt || '') || 0;
    const incomingTime = Date.parse(incoming.finishedAt || '') || 0;
    return previousTime > incomingTime ? previous : incoming;
  };
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
    const operations = new Map((value.operations || []).map(operation => [operation.id, operation]));
    for (const [id, receipt] of approvalReceipts) {
      const latest = newerOperation(receipt, operations.get(id) || receipt);
      approvalReceipts.set(id, latest);
      operations.set(id, latest);
    }
    state = { ...value, operations: [...operations.values()] };
    for (const listener of listeners) { try { listener(state); } catch (error) { console.warn('LivingThread UI:', error.message); } }
  };
  const approve = async (findingId, actionIds) => {
    // Capture the exact reviewed targets before the request; the finding can be
    // invalidated by the action's own observation before its response comes back.
    const finding = state.findings?.find(item => item.id === findingId);
    const actions = new Map((finding?.actions || []).filter(action => actionIds.includes(action.id)).map(action => [action.id, action]));
    const result = await send({ type: 'approve', findingId, actionIds });
    if (result?.ok === true && Array.isArray(result.operations)) {
      for (const operation of result.operations) {
        const action = actions.get(operation.actionId);
        if (typeof operation.id !== 'string' || !action || operation.findingId !== findingId || operation.sourceId !== action.sourceId || operation.kind !== action.kind) continue;
        approvalReceipts.set(operation.id, newerOperation(approvalReceipts.get(operation.id), operation));
      }
      // This is a receipt handoff only. Never retry an approval or execute a tool here.
      update(state);
    }
    return result;
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
    approve,
    clarify: (findingId, text) => send({ type: 'clarify', findingId, text }),
    dismiss: findingId => send({ type: 'dismiss', findingId }),
    report: data => send({ type: 'diagnostic', data: { ...data, url: location.href } }),
    request: send,
    rescan: scan
  };
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type === 'state') { update(message.state); respond({ ok: true }); scan(); return false; }
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
