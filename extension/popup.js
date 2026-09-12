const $ = id => document.getElementById(id);
const manifest = chrome.runtime.getManifest();
let current;
let actionInFlight = '';
let actionFailure = null;
let pollFailure = '';
let polling = false;
let generation = 0;
let receivedAt = '';
let lastAction = 'No connection or session action requested in this popup.';
let hasRequestedConnection = false;

$('version').textContent = `v${manifest.version}`;

async function send(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result || typeof result !== 'object') throw new Error('The extension worker did not return a response. Reload LivingThread, then reopen this popup.');
  if (result.error && !('session' in result)) throw new Error(result.error);
  return result;
}

function messageOf(error) { return error instanceof Error ? error.message : String(error || 'The request did not complete.'); }
function isAuthorizationError(message) { return /unauthori[sz]ed|authori[sz]ation|authentication|invalid.{0,15}token|pairing|\b401\b|not paired/i.test(message || ''); }

function acceptState(state) {
  if (!state?.session || typeof state.connected !== 'boolean') throw new Error('The extension returned an incomplete connection state. Reload it and try again.');
  current = state;
  receivedAt = new Date().toISOString();
  pollFailure = '';
  // A passive failed poll never removes an action failure. Only its requested result can clear it.
  if (actionFailure && state.connected === true) {
    if (actionFailure.kind === 'connect' || (actionFailure.kind === 'session' && state.session.enabled === actionFailure.expectedEnabled)) actionFailure = null;
  }
}

function render() {
  const connected = current?.connected === true && !pollFailure;
  const enabled = current?.session?.enabled === true;
  const connectionError = pollFailure || (!connected ? current?.error || '' : '');
  const authorizationError = isAuthorizationError(connectionError || actionFailure?.message);
  const initial = !current && !pollFailure && !actionFailure;
  $('connection').textContent = actionInFlight === 'connect' ? '◌ Requesting a connection…'
    : initial ? '◌ Checking connection…'
    : connected ? (enabled ? '● Connected · work session active' : '● Connected · work session paused')
    : authorizationError ? '○ Connection not authorized' : '○ Local service not connected';
  $('connection').dataset.state = connected ? (enabled ? 'active' : 'paused') : initial ? 'checking' : 'disconnected';
  $('connection-detail').textContent = connected
    ? enabled ? 'The service reports an active session. Open supported pages to observe their content.' : 'The service is connected. Observation stays paused until you start a work session.'
    : actionInFlight === 'connect' ? 'Waiting for the extension and local service to confirm pairing.'
    : authorizationError ? 'Click Connect local service to authorize this extension with the running local service.'
    : initial ? 'This checks the existing connection only; it does not pair or start a session.'
    : 'Make sure the local service is running at 127.0.0.1:4317, then retry the connection.';
  $('connect').hidden = connected;
  $('connect').disabled = !!actionInFlight;
  $('connect').textContent = actionInFlight === 'connect' ? 'Connecting…' : hasRequestedConnection ? 'Retry connection' : 'Connect local service';
  $('session').disabled = !!actionInFlight || !connected;
  $('session').textContent = actionInFlight === 'session' ? (enabled ? 'Pausing…' : 'Starting…') : enabled && connected ? 'Pause work session' : 'Start work session';
  $('session-note').textContent = !connected && enabled ? 'Last reported session: active. Its current state is unverified while disconnected.' : '';
  $('session-note').hidden = !$('session-note').textContent;
  const sources = Array.isArray(current?.observations) ? current.observations : [];
  const findings = Array.isArray(current?.findings) ? current.findings : [];
  $('summary').textContent = current
    ? `${connected ? '' : 'Last received: '}${sources.length} sources observed · ${findings.length} open findings${connected && current.checking ? ' · Checking…' : ''}`
    : 'No session state received yet.';
  $('sources').replaceChildren();
  for (const source of sources.slice(-8)) {
    const row = document.createElement('div'); row.className = 'source';
    const title = document.createElement('strong'); title.textContent = `${String(source.app || 'Source').toUpperCase()} · ${source.title || 'Untitled source'}`;
    row.append(title, document.createTextNode(`${source.coverage || 'Unknown'} coverage${source.stale || !connected ? ' · current contents unchecked' : ''}`));
    $('sources').append(row);
  }
  const error = actionFailure?.message || connectionError || current?.error || '';
  $('error').textContent = error;
  $('error').hidden = !error;
  $('action-status').textContent = lastAction;
  $('diagnostics').textContent = JSON.stringify({
    extensionVersion: manifest.version,
    extensionId: chrome.runtime.id,
    service: 'http://127.0.0.1:4317',
    connected,
    session: connected ? (enabled ? 'active' : 'paused') : 'unverified',
    lastStateResponseAt: receivedAt || null,
    actionInFlight: actionInFlight || null,
    lastAction,
    connectionError: connectionError || null,
    actionError: actionFailure?.message || null,
    slack: current?.slack,
    diagnostics: current?.diagnostics?.slice(-5),
  }, null, 2);
}

async function poll() {
  if (polling || actionInFlight) return;
  polling = true;
  const requestGeneration = generation;
  try {
    const state = await send({ type: 'state' });
    if (requestGeneration !== generation || actionInFlight) return;
    acceptState(state);
  } catch (error) {
    if (requestGeneration !== generation || actionInFlight) return;
    pollFailure = messageOf(error);
  } finally {
    polling = false;
    if (requestGeneration === generation && !actionInFlight) render();
  }
}

async function runAction(kind) {
  if (actionInFlight) return;
  if (kind === 'session' && (current?.connected !== true || pollFailure)) return;
  const expectedEnabled = kind === 'session' ? !current.session.enabled : undefined;
  generation++;
  actionInFlight = kind;
  if (kind === 'connect') hasRequestedConnection = true;
  lastAction = kind === 'connect' ? 'Connection requested; waiting for confirmation.' : `${expectedEnabled ? 'Start' : 'Pause'} requested; waiting for the service.`;
  // Keep the previous error visible during a retry. It disappears only after the requested result succeeds.
  render();
  try {
    const state = await send(kind === 'connect' ? { type: 'connect' } : { type: 'session', enabled: expectedEnabled });
    acceptState(state);
    if (state.connected !== true) throw new Error(state.error || 'The service has not confirmed a connection. Check that it is running, then click Retry connection.');
    if (kind === 'session' && state.session.enabled !== expectedEnabled) throw new Error(`The service has not confirmed that the session is ${expectedEnabled ? 'active' : 'paused'}. Its latest reported state is shown above.`);
    actionFailure = null;
    lastAction = kind === 'connect' ? `Connection confirmed. Work session ${state.session.enabled ? 'active' : 'paused'}.` : `Service confirmed: work session ${expectedEnabled ? 'active' : 'paused'}.`;
  } catch (error) {
    const reason = messageOf(error);
    actionFailure = { kind, expectedEnabled, message: kind === 'connect' ? `Connection failed: ${reason}` : `Session request not confirmed: ${reason}` };
    lastAction = kind === 'connect' ? 'Connection request did not produce a confirmed connection.' : 'The requested session change was not confirmed.';
  } finally {
    actionInFlight = '';
    render();
  }
}

$('connect').addEventListener('click', () => runAction('connect'));
$('session').addEventListener('click', () => runAction('session'));
render();
poll();
setInterval(poll, 2000);
