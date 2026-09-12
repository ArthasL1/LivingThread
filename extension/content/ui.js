(() => {
  'use strict';

  const LT = globalThis.LivingThread;
  if (!LT || document.querySelector('[data-livingthread="host"]')) return;
  const host = document.createElement('div');
  host.dataset.livingthread = 'host';
  host.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:2147483600;display:block;color-scheme:light;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host{all:initial;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#16342f;line-height:1.5}
    *{box-sizing:border-box}button,input,textarea{font:inherit}button,a,input,textarea{-webkit-tap-highlight-color:transparent}
    button{cursor:pointer}button:disabled{cursor:default;opacity:.55}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #66d6ad;outline-offset:3px}
    button{border:0}a{color:#16715b;text-decoration:none}a:hover{text-decoration:underline}
    .shell{width:366px;max-width:calc(100vw - 32px);border:1px solid #dce7e0;border-radius:17px;background:#fffefb;box-shadow:0 14px 48px #163b3329,0 2px 8px #163b3310;overflow:hidden}
    .notice{display:block;width:100%;text-align:left;background:#fffefb;padding:15px 17px;color:inherit}
    .brand{display:flex;align-items:center;gap:8px;font-weight:650;font-size:12px;letter-spacing:.015em}.brand .wordmark{flex:1}
    .mark{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:8px;background:#174d40;color:#b5f2cd;font-size:19px;font-weight:600;line-height:1}
    .eyebrow{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#a26d22;font-weight:700;margin:13px 0 4px}.event{font-size:17px;line-height:1.3;font-weight:680;letter-spacing:-.025em;margin:0 0 6px;overflow-wrap:anywhere}.summary{font-size:13px;line-height:1.55;color:#52645c;margin:0}
    .notice-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;font-size:12px;font-weight:600;color:#1c795d}.count{font-weight:400;color:#74817a}
    .header{padding:15px 17px 12px;border-bottom:1px solid #e9ede7}.icon-button{height:26px;min-width:26px;border-radius:7px;background:transparent;color:#6a7b72;font-size:19px;line-height:1}.icon-button:hover{background:#edf3ed}
    .content{max-height:min(64vh,590px);overflow-y:auto;overscroll-behavior:contain;padding:0 17px 16px;scrollbar-width:thin}
    .intro{padding:15px 0 8px}.explanation{margin:8px 0;color:#5d6b63;font-size:12px;line-height:1.6}
    .section-label{display:flex;justify-content:space-between;align-items:center;margin:15px 0 8px;font-weight:650;font-size:11px;color:#617067;letter-spacing:.065em;text-transform:uppercase}
    .evidence{padding:10px 12px;margin-bottom:7px;background:#f4f6f0;border:1px solid #e6ebe1;border-radius:10px}.source-row{display:flex;align-items:center;gap:7px;min-width:0;font-size:11px}.app{font-weight:700;color:#3a5546}.source-link{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tag{font-size:9px;border-radius:4px;padding:1px 5px;background:#e3ece1;color:#506752;white-space:nowrap}.tag.outdated{background:#f5e4c5;color:#8c6425}.tag.proposal{background:#e5e6f8;color:#64578d}
    blockquote{padding:0;margin:7px 0 5px;font-size:12px;color:#34473c;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.meta{color:#7a877d;font-size:10px}.stale{color:#9a6b26}
    .action{margin:0 0 8px;border:1px solid #dce5dc;border-radius:10px;overflow:hidden;background:#fff}.action-title{display:flex;align-items:flex-start;gap:8px;padding:10px 11px;font-size:12px;font-weight:600;background:#f8faf6;cursor:pointer}.action-title input{accent-color:#176f53;margin:3px 0 0;width:14px;height:14px;flex-shrink:0}.action-label{flex:1;min-width:0;overflow-wrap:anywhere}.action-subtitle{font-size:10px;color:#6b7c70;font-weight:400;margin-top:2px}.preview{padding:9px 11px;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.before{background:#fff8f0;color:#95683f;border-top:1px solid #f1e9df}.after{background:#eff8f0;color:#266244;border-top:1px solid #e3eee2}.preview-label{display:block;margin-bottom:3px;font-size:9px;text-transform:uppercase;letter-spacing:.075em;font-weight:700;opacity:.8}.action-note{font-size:11px;color:#976d2e;padding:8px 11px;background:#fff7e9}
    .footer{padding:12px 17px 14px;background:#f8faf5;border-top:1px solid #e4ebe1}.primary{width:100%;border-radius:9px;background:#195e48;color:#fff;padding:10px 13px;font-size:12px;font-weight:650}.primary:hover:enabled{background:#114c39}.secondary{border:1px solid #dce6d9;background:#fffefb;border-radius:7px;padding:7px 10px;color:#365d48;font-size:11px}.secondary:hover:enabled{background:#edf4e9}.footer-row{display:flex;gap:8px;justify-content:space-between;margin-top:9px}.text-button{padding:5px 0;background:none;color:#687b6b;font-size:11px}.text-button:hover{color:#225c40;text-decoration:underline}
    .clarify{margin-top:13px;padding:12px;border:1px solid #dae6d6;background:#f4f8ef;border-radius:10px}.clarify label{display:block;font-size:12px;font-weight:600;margin-bottom:6px}.clarify p{font-size:11px;color:#60745f;margin:0 0 8px}.clarify textarea{display:block;width:100%;min-height:79px;resize:vertical;border:1px solid #ccd9c8;border-radius:7px;padding:8px;background:#fffefb;color:#294431;line-height:1.5}.clarify .secondary{margin-top:8px}
    .operation{display:flex;gap:8px;align-items:flex-start;border-radius:8px;padding:9px 11px;margin-top:7px;background:#eef5ec;font-size:11px;color:#38583a}.operation.failed,.operation.error,.operation.uncertain{background:#fff2df;color:#8b612b}.operation.pending,.operation.running,.operation.executing{background:#eef1f6;color:#516a80}.operation-title{font-weight:650;margin-bottom:2px}.error{margin-top:10px;padding:9px 11px;background:#fff1e7;border:1px solid #f0d8be;border-radius:8px;color:#8c5d31;font-size:11px;overflow-wrap:anywhere}
    .pill{display:flex;align-items:center;gap:8px;background:#fffefb;border:1px solid #dce7df;border-radius:99px;box-shadow:0 3px 15px #133d2e12;padding:8px 12px;color:#57745f;font-size:11px}.dot{display:inline-block;width:6px;height:6px;border-radius:100%;background:#4b9b72}.dot.offline{background:#cf9453}.pulse{animation:lt-pulse 1.5s ease-in-out infinite}@keyframes lt-pulse{50%{opacity:.35}}@media(prefers-reduced-motion:reduce){.pulse{animation:none}}
    .paging{display:flex;align-items:center;gap:6px;margin-left:5px;font-size:10px;color:#7b8a7c}.paging button{font-size:14px;width:21px;height:23px;border-radius:5px;color:#47684f;background:#eef3e9}.muted-note{font-size:11px;color:#71816e;margin:10px 0 0}.badge{font-size:10px;font-weight:600;color:#2e7554;padding:2px 6px;background:#e9f3e5;border-radius:5px}
  `;
  shadow.append(style);
  const mount = document.createElement('div');
  shadow.append(mount);
  (document.body || document.documentElement).append(host);

  let state = {};
  let expanded = false;
  let showClarification = false;
  let currentId = null;
  let busy = false;
  let localError = '';
  let lastSignature = '';
  let clarificationText = '';
  const selected = new Map();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function button(label, className, handler, title) {
    const node = el('button', className, label);
    node.type = 'button';
    if (title) node.setAttribute('aria-label', title);
    node.addEventListener('click', handler);
    return node;
  }

  function observations() { return Array.isArray(state.observations) ? state.observations : Object.values(state.observations || {}); }
  function source(id) { return observations().find(item => item.id === id); }
  function appName(app) { return ({ gmail: 'Gmail', docs: 'Google Docs', slack: 'Slack' })[app] || 'Source'; }
  function isLocal(id) {
    if (LT.getAnchor?.(id)) return true;
    const observation = source(id);
    if (!observation) return false;
    if (location.hostname === 'docs.google.com') {
      const docId = location.pathname.match(/\/document\/d\/([^/]+)/)?.[1];
      return !!docId && observation.app === 'docs' && (observation.context?.documentId === docId || observation.url?.includes(`/document/d/${docId}/`));
    }
    return false;
  }

  function relevantFindings() {
    return (state.findings || []).filter(finding => !['dismissed', 'resolved', 'superseded'].includes(finding.status) && [...(finding.evidence || []), ...(finding.actions || [])].some(item => isLocal(item.sourceId)));
  }

  function safeLink(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return null;
      if (['docs.google.com', 'mail.google.com', 'app.slack.com'].includes(parsed.hostname) || parsed.hostname.endsWith('.slack.com')) return parsed.href;
    } catch {}
    return null;
  }

  function observedLabel(observation) {
    if (!observation) return 'Source details unavailable';
    const date = new Date(observation.observedAt);
    const stamp = Number.isFinite(date.getTime()) ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'unknown time';
    const stale = observation.stale || observation.live === false || observation.status === 'stale';
    return `${stale ? 'Last observed' : 'Observed'} ${stamp}${observation.coverage && observation.coverage !== 'full' ? ` · ${observation.coverage} coverage` : ''}${stale ? ' · current contents unchecked' : ''}`;
  }

  function isBlocked(action) {
    return action.enabled === false || action.valid === false || action.validated === false || action.blocked || ['blocked', 'invalid', 'unavailable'].includes(action.status) || action.validation?.valid === false || (state.operations || []).some(operation => operation.actionId === action.id && ['queued', 'running', 'succeeded', 'uncertain'].includes(operation.status));
  }

  function selectedIds(finding) {
    if (!selected.has(finding.id)) selected.set(finding.id, new Set((finding.actions || []).filter(action => !isBlocked(action)).map(action => action.id)));
    const ids = selected.get(finding.id);
    return (finding.actions || []).filter(action => ids.has(action.id) && !isBlocked(action)).map(action => action.id);
  }

  function approveLabel(finding) {
    const ids = selectedIds(finding);
    const actions = (finding.actions || []).filter(action => ids.includes(action.id));
    const messages = actions.filter(action => action.kind === 'slack_message').length;
    const edits = actions.length - messages;
    const parts = [];
    if (edits) parts.push(`Apply ${edits === 1 ? 'change' : `${edits} changes`}`);
    if (messages) parts.push(`${edits ? 'send' : 'Send'} ${messages === 1 ? 'message' : `${messages} messages`}`);
    return busy ? 'Working…' : parts.join(' and ') || 'Select an action to continue';
  }

  function refreshApproval(finding) {
    const control = shadow.getElementById('lt-approve');
    if (control) { control.textContent = approveLabel(finding); control.disabled = busy || selectedIds(finding).length === 0; }
  }

  async function run(callback) {
    if (busy) return;
    busy = true;
    localError = '';
    render(true);
    try {
      const result = await callback();
      if (result?.ok === false || result?.error) localError = result.message || result.error || 'The request could not be completed.';
    } catch (error) {
      localError = error?.message || 'The local service could not be reached. Check its connection and try again.';
    } finally {
      busy = false;
      render(true);
    }
  }

  function addBrand(parent, controls = false, findings = []) {
    const row = el('div', 'brand');
    const mark = el('span', 'mark', '↝');
    mark.setAttribute('aria-hidden', 'true');
    row.append(mark, el('span', 'wordmark', 'LivingThread'));
    if (controls && findings.length > 1) {
      const index = Math.max(0, findings.findIndex(finding => finding.id === currentId));
      const paging = el('div', 'paging');
      paging.append(el('span', '', `${index + 1}/${findings.length}`), button('›', '', () => {
        currentId = findings[(index + 1) % findings.length].id;
        showClarification = false;
        clarificationText = '';
        render(true);
      }, 'Review next finding'));
      row.append(paging);
    }
    if (controls) row.append(button('−', 'icon-button', () => { expanded = false; render(true); }, 'Minimize review'));
    parent.append(row);
  }

  function addEvidence(parent, finding) {
    parent.append(el('div', 'section-label', 'What connects these details'));
    for (const evidence of finding.evidence || []) {
      const observation = source(evidence.sourceId);
      const card = el('div', 'evidence');
      const row = el('div', 'source-row');
      row.append(el('span', 'app', appName(observation?.app)));
      const title = observation?.title || 'Open source';
      const url = safeLink(observation?.url);
      const link = el(url ? 'a' : 'span', 'source-link', title);
      link.title = title;
      if (url) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      row.append(link, el('span', `tag ${evidence.role || ''}`, ({ current: 'Current', outdated: 'May be outdated', proposal: 'Proposed', context: 'Context' })[evidence.role] || 'Evidence'));
      card.append(row, el('blockquote', '', evidence.quote));
      card.append(el('div', `meta${observation?.stale ? ' stale' : ''}`, observedLabel(observation)));
      parent.append(card);
    }
  }

  function addActions(parent, finding) {
    if (!finding.actions?.length) {
      parent.append(el('p', 'muted-note', finding.kind === 'pending' ? 'The change is not confirmed. Existing arrangements stay as they are.' : 'Review the evidence or explain the difference before choosing an update.'));
      return;
    }
    parent.append(el('div', 'section-label', 'Review the next steps'));
    const ids = selectedIds(finding);
    for (const action of finding.actions) {
      const observation = source(action.sourceId);
      const card = el('div', 'action');
      const label = el('label', 'action-title');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = ids.includes(action.id);
      checkbox.disabled = busy || isBlocked(action);
      checkbox.addEventListener('change', () => {
        const choices = selected.get(finding.id);
        checkbox.checked ? choices.add(action.id) : choices.delete(action.id);
        refreshApproval(finding);
      });
      const name = el('div', 'action-label', action.kind === 'slack_message' ? 'Send a Slack message' : `Update ${appName(observation?.app)}`);
      const destination = action.kind === 'slack_message'
        ? `${action.channelName || action.channelId || observation?.context?.channelId || 'Destination unavailable'}${action.threadTs ? ` · thread ${action.threadTs}` : ' · channel message'} · as LivingThread · visible to channel members`
        : observation?.title || 'Observed content';
      name.append(el('div', 'action-subtitle', destination));
      label.append(checkbox, name);
      card.append(label);
      if (action.kind === 'slack_message') {
        const preview = el('div', 'preview after');
        preview.append(el('span', 'preview-label', 'Exact message'), document.createTextNode(action.text || ''));
        card.append(preview);
      } else {
        const before = el('div', 'preview before');
        before.append(el('span', 'preview-label', 'Current wording'), document.createTextNode(action.before || ''));
        const after = el('div', 'preview after');
        after.append(el('span', 'preview-label', 'After your approval'), document.createTextNode(action.after || ''));
        card.append(before, after);
      }
      if (isBlocked(action)) {
        const operation = (state.operations || []).find(item => item.actionId === action.id);
        card.append(el('div', 'action-note', action.blockedReason || action.validationError || action.validation?.message || (operation ? 'This action was already approved. See its result below before taking another step.' : 'Reopen and check this source before applying its update.')));
      }
      parent.append(card);
    }
  }

  function addOperations(parent, findingId) {
    const operations = (state.operations || []).filter(operation => operation.findingId === findingId);
    if (!operations.length) return;
    parent.append(el('div', 'section-label', 'Operation results'));
    for (const operation of operations) {
      const card = el('div', `operation ${operation.status}`);
      const good = ['succeeded', 'success', 'completed', 'verified'].includes(operation.status);
      card.append(el('span', '', good ? '✓' : ['failed', 'error', 'uncertain'].includes(operation.status) ? '!' : '·'));
      const details = el('div');
      details.append(el('div', 'operation-title', `${appName(source(operation.sourceId)?.app)} · ${operation.status || 'pending'}`));
      details.append(el('div', '', operation.message || 'Waiting for verification.'));
      card.append(details);
      parent.append(card);
    }
  }

  function addClarification(parent, finding) {
    if (!showClarification) return;
    const box = el('div', 'clarify');
    const label = el('label', '', 'Explain the difference');
    label.htmlFor = 'lt-clarification';
    const input = el('textarea');
    input.id = 'lt-clarification';
    input.placeholder = 'For example: 14:30 is for staff setup; customers arrive at 15:00.';
    input.maxLength = 1600;
    input.value = clarificationText;
    input.disabled = busy;
    input.addEventListener('input', () => { clarificationText = input.value; submit.disabled = busy || !clarificationText.trim(); });
    const submit = button('Reconsider with this context', 'secondary', () => {
      const text = clarificationText.trim();
      if (!text) return;
      run(async () => {
        const result = await LT.clarify(finding.id, text);
        if (result?.ok !== false && !result?.error) { showClarification = false; clarificationText = ''; }
        return result;
      });
    });
    submit.disabled = busy || !clarificationText.trim();
    box.append(label, el('p', '', 'LivingThread will recheck the relationship and suggest appropriate next steps. This does not authorize an edit or message.'), input, submit);
    parent.append(box);
  }

  function position(finding) {
    const ids = [...(finding?.actions || []), ...(finding?.evidence || [])].map(item => item.sourceId);
    const anchor = ids.map(id => LT.getAnchor?.(id)).find(Boolean);
    host.style.left = '';
    host.style.right = '22px';
    host.style.bottom = '22px';
    host.style.top = '';
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      if (rect.left > 398) {
        host.style.right = `${Math.max(16, window.innerWidth - rect.left + 12)}px`;
        host.style.bottom = `${Math.max(16, window.innerHeight - rect.bottom + 12)}px`;
      } else {
        host.style.right = '16px';
        host.style.bottom = '16px';
      }
    } else if (location.hostname === 'docs.google.com' && expanded) {
      host.style.top = '108px';
      host.style.bottom = '';
    }
  }

  function render(force = false) {
    const findings = relevantFindings();
    let finding = findings.find(item => item.id === currentId) || findings[0];
    if (finding) currentId = finding.id;
    const signature = JSON.stringify({ enabled: state.session?.enabled, connected: state.connected, checking: state.checking, error: state.error, findings, operations: state.operations, expanded, currentId, showClarification, localError, busy, sources: observations().map(item => [item.id, item.stale, item.observedAt, item.coverage]) });
    if (!force && signature === lastSignature) return;
    // Background polling must not replace a textarea while the user is entering a clarification.
    if (!force && shadow.activeElement?.tagName === 'TEXTAREA') return;
    lastSignature = signature;
    mount.replaceChildren();
    host.hidden = !state.session?.enabled;
    if (host.hidden) return;
    position(finding);
    if (!finding) {
      const pill = el('div', 'pill');
      const dot = el('span', `dot${state.connected === false ? ' offline' : ''}${state.checking ? ' pulse' : ''}`);
      pill.append(dot, el('span', '', state.connected === false ? 'LivingThread · Service offline' : state.error ? 'LivingThread · Check paused' : state.checking ? 'LivingThread · Checking details' : 'LivingThread · Watching this session'));
      pill.title = state.error || 'Related information is checked automatically within your enabled work session.';
      const previousOps = (state.operations || []).filter(operation => operation.findingId === currentId);
      if (expanded && previousOps.length) {
        const shell = el('section', 'shell');
        const header = el('div', 'header'); addBrand(header, true);
        const content = el('div', 'content');
        content.append(el('div', 'intro', 'Your reviewed actions'));
        addOperations(content, currentId);
        if (localError) content.append(el('div', 'error', localError));
        shell.append(header, content); mount.append(shell);
      } else mount.append(pill);
      return;
    }

    const shell = el('section', 'shell');
    shell.setAttribute('aria-label', 'LivingThread context review');
    if (!expanded) {
      const notice = button('', 'notice', () => { expanded = true; render(true); });
      addBrand(notice);
      notice.append(el('div', 'eyebrow', finding.kind === 'pending' ? 'An arrangement needs confirmation' : 'A detail may be out of date'));
      notice.append(el('div', 'event', finding.event || 'Connected details'));
      notice.append(el('p', 'summary', finding.summary));
      const footer = el('div', 'notice-footer');
      footer.append(el('span', '', 'Review the connection →'), el('span', 'count', `${new Set((finding.evidence || []).map(item => source(item.sourceId)?.app).filter(Boolean)).size} apps`));
      notice.append(footer);
      shell.append(notice);
    } else {
      const header = el('div', 'header');
      addBrand(header, true, findings);
      const content = el('div', 'content');
      const intro = el('div', 'intro');
      intro.append(el('div', 'eyebrow', finding.kind === 'pending' ? 'Keep the decision open' : 'One change, connected details'), el('h2', 'event', finding.event || 'Connected details'), el('p', 'summary', finding.summary));
      if (finding.explanation) intro.append(el('p', 'explanation', finding.explanation));
      content.append(intro);
      addEvidence(content, finding);
      addActions(content, finding);
      addOperations(content, finding.id);
      addClarification(content, finding);
      if (localError || state.error) content.append(el('div', 'error', localError || state.error));
      const footer = el('div', 'footer');
      if (finding.actions?.length) {
        const approve = button(approveLabel(finding), 'primary', () => {
          const ids = selectedIds(finding);
          if (ids.length) run(() => LT.approve(finding.id, ids));
        });
        approve.id = 'lt-approve';
        approve.disabled = busy || !selectedIds(finding).length;
        footer.append(approve);
      }
      const options = el('div', 'footer-row');
      const clarify = button(showClarification ? 'Cancel explanation' : 'This difference is intentional…', 'text-button', () => {
        showClarification = !showClarification;
        render(true);
        if (showClarification) shadow.getElementById('lt-clarification')?.focus({ preventScroll: true });
      });
      const dismiss = button('Dismiss', 'text-button', () => run(() => LT.dismiss(finding.id)));
      clarify.disabled = dismiss.disabled = busy;
      options.append(clarify, dismiss);
      footer.append(options);
      shell.append(header, content, footer);
    }
    mount.append(shell);
  }

  LT.onState(next => { state = next || {}; render(); });
  state = LT.getState?.() || {};
  render();
  window.addEventListener('resize', () => position(relevantFindings().find(finding => finding.id === currentId)), { passive: true });
})();
