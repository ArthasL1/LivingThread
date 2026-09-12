const BASE = 'http://127.0.0.1:4317';
let pumping = null;
let cachedState = { connected: false, session: { enabled: false }, observations: [], findings: [], operations: [] };
async function api(path, body) {
  const { token } = await chrome.storage.local.get('token');
  const headers = { 'Content-Type': 'application/json', 'X-LivingThread-Extension': chrome.runtime.id };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(BASE + path, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(12000) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${value.error || 'The local service rejected this request.'}`);
  return value;
}
async function connect() {
  const pair = await api('/api/pair', {});
  await chrome.storage.local.set({ token: pair.token });
  // A poll started without the new token must finish before reporting this connection.
  if (pumping) await pumping;
  return pump();
}
async function pump() {
  if (pumping) return pumping;
  pumping = pumpOnce();
  try { return await pumping; }
  finally { pumping = null; }
}
async function pumpOnce() {
  try {
    cachedState = { ...(await api('/api/state')), connected: true };
    const commands = await api('/api/commands', {});
    for (const command of commands) {
      let result;
      try { result = await chrome.tabs.sendMessage(command.tabId, { type: 'action', action: command.action }); }
      catch (error) { result = { ok: false, message: 'The target editor is unavailable. Reopen it and review a fresh proposal.' }; }
      await api('/api/results', { operationId: command.operationId, result });
    }
    if (commands.length) cachedState = { ...(await api('/api/state')), connected: true };
    await chrome.action.setBadgeText({ text: cachedState.findings?.length ? String(cachedState.findings.length) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#ad623a' });
    const tabs = await chrome.tabs.query({ url: ['https://mail.google.com/*', 'https://docs.google.com/document/d/*'] });
    await Promise.allSettled(tabs.map(tab => chrome.tabs.sendMessage(tab.id, { type: 'state', state: cachedState })));
  } catch (error) { cachedState = { ...cachedState, connected: false, error: error.message }; }
  return cachedState;
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  (async () => {
    if (message.type === 'connect') return connect();
    if (message.type === 'state') return pump();
    if (message.type === 'session') { await api('/api/session', { enabled: !!message.enabled }); if (pumping) await pumping; return pump(); }
    if (message.type === 'observe') {
      if (!sender.tab) throw new Error('Observation must originate from an app tab.');
      const result = await api('/api/observations', { ...message.observation, tabId: sender.tab.id });
      if (result.changed) pump();
      return result;
    }
    if (message.type === 'diagnostic') return api('/api/diagnostics', { ...message.data, tabId: sender.tab?.id });
    if (message.type === 'presence' && sender.tab) return api('/api/closed', { tabId: sender.tab.id, activeIds: message.activeIds });
    if (message.type === 'capabilities') return { docsEditor: await chrome.permissions.contains({ permissions: ['debugger'] }) };
    if (message.type === 'docs-export') return docsExport(sender, message);
    if (message.type === 'approve') { const result = await api('/api/approve', message); pump(); return result; }
    if (message.type === 'clarify') return api('/api/clarify', message);
    if (message.type === 'dismiss') return api('/api/dismiss', message);
    if (message.type === 'debugger') return docsCommand(sender.tab?.id ?? message.tabId, message.method, message.params || {});
    throw new Error('Unsupported LivingThread request.');
  })().then(respond, error => respond({ error: error.message }));
  return true;
});
async function docsExport(sender, message) {
  const page = new URL(sender.tab?.url || sender.url || 'about:blank');
  const match = page.pathname.match(/^\/document\/d\/([A-Za-z0-9_-]+)\/edit\/?$/);
  // Bind the export to the real tab, including editors that message from a child frame.
  if (!sender.tab || page.origin !== 'https://docs.google.com' || !match) throw new Error(`Document exports must originate from an open Google Doc (tab: ${!!sender.tab}, host: ${page.hostname}, supported path: ${!!match}).`);
  if (!(await api('/api/state')).session.enabled) throw new Error('The work session is paused.');
  const url = new URL(`https://docs.google.com/document/d/${match[1]}/export`);
  url.searchParams.set('format', 'txt');
  const documentTab = page.searchParams.get('tab');
  if (documentTab) url.searchParams.set('tab', documentTab);
  if (/^\d{1,2}$/.test(message.accountSlot || '')) url.searchParams.set('authuser', message.accountSlot);
  let response;
  try { response = await fetch(url.href, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(8000) }); }
  catch { throw new Error('The document export request could not complete. Check Google Docs access and the extension host permissions.'); }
  if (!response.ok || !/text\/plain|application\/octet-stream/.test(response.headers.get('content-type') || '')) throw new Error(`Google Docs did not return document text (HTTP ${response.status}).`);
  const body = await response.text();
  if (body.length > 100000) throw new Error('This document exceeds the prototype text limit.');
  return { body };
}
// Docs-only experimental adapter bridge. It never navigates browser settings or other hosts.
async function docsCommand(tabId, method, params) {
  const tab = await chrome.tabs.get(tabId);
  if (!/^https:\/\/docs\.google\.com\/document\/d\//.test(tab.url || '')) throw new Error('This adapter only supports an open Google document.');
  const methods = ['Accessibility.getFullAXTree', 'Input.dispatchKeyEvent', 'Input.insertText', 'DOM.getDocument'];
  if (!methods.includes(method)) throw new Error('Unsupported Docs adapter operation.');
  if (!(await chrome.permissions.contains({ permissions: ['debugger'] }))) throw new Error('The Docs editor permission is not enabled.');
  try { await chrome.debugger.attach({ tabId }, '1.3'); } catch (error) { if (!/already attached/i.test(error.message)) throw error; }
  try { return await chrome.debugger.sendCommand({ tabId }, method, params); }
  finally { await chrome.debugger.detach({ tabId }).catch(() => {}); }
}
chrome.tabs.onRemoved.addListener(tabId => api('/api/closed', { tabId }).catch(() => {}));
chrome.tabs.onUpdated.addListener((tabId, change) => { if (change.status === 'loading') api('/api/closed', { tabId }).catch(() => {}); });
chrome.alarms.create('livingthread', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(() => pump());
