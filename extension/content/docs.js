(() => {
  const LT = globalThis.LivingThread;
  if (!LT) return;
  const READ_POLICY = 'docs-export-v3-idle30s-save-refresh-backoff60s';
  const IDLE_READ_INTERVAL = 30000;
  const RATE_LIMIT_BACKOFF = 60000;
  const VERIFICATION_DELAYS = [0, 4000, 4000];
  let lastDiagnostic = '';
  let applying = false;
  let exported = null;
  let lastExportAt = 0;
  let retryReadAfter = 0;
  let lastReadError = '';
  let lastReportedReadError = '';
  let readInFlight = null;
  let saveGeneration = 0;
  let savedRefreshPending = false;
  let lastSaveState = 'unknown';
  let policyReported = false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function rateLimited(error) { return /(?:\b429\b|too many requests|rate.?limit)/i.test(error?.message || String(error)); }
  function indicatorState(label) {
    if (/saving|正在保存|儲存中|正在儲存/i.test(label || '')) return 'saving';
    if (/saved to drive|all changes saved|所有更改.*保存|已保存到云端|已儲存到雲端/i.test(label || '')) return 'saved';
    return 'unknown';
  }
  function checkSaveIndicator() {
    const badge = document.querySelector('#docs-save-indicator-badge');
    const next = indicatorState(badge?.getAttribute('aria-label') || '');
    const transitionedToSaved = lastSaveState === 'saving' && next === 'saved';
    // Update state before requesting a scan; runtime may enter scan synchronously.
    if (next !== 'unknown') lastSaveState = next;
    if (transitionedToSaved) {
      saveGeneration++;
      savedRefreshPending = true;
      if (!applying) LT.rescan?.();
    }
    return next;
  }
  function identity() {
    const match = location.pathname.match(/\/document\/d\/([^/]+)/);
    if (!match) return null;
    const documentTab = new URL(location.href).searchParams.get('tab') || 'default';
    const accountSlot = new URL(location.href).searchParams.get('authuser') ||
      new URL(document.querySelector('#docs-branding-logo-link')?.href || location.href).searchParams.get('authuser') || '';
    return { documentId: match[1], documentTab, accountSlot };
  }
  function extract() {
    const id = identity();
    if (!id) return null;
    const title = document.querySelector('.docs-title-input')?.value || document.title.replace(/ - Google Docs$/, '');
    const candidates = [...document.querySelectorAll('.kix-canvas-tile-content svg [aria-label], .kix-canvas-tile-content [role="img"][aria-label]')];
    const lines = [];
    const seen = new Set();
    for (const node of candidates) {
      const label = node.getAttribute('aria-label')?.replace(/\u00a0/g, ' ').trim();
      if (!label) continue;
      const page = node.closest('.kix-page');
      const key = `${[...document.querySelectorAll('.kix-page')].indexOf(page)}|${node.getAttribute('x')}|${node.getAttribute('y')}|${label}`;
      if (!seen.has(key)) { seen.add(key); lines.push(label); }
    }
    if (!lines.length) {
      for (const node of document.querySelectorAll('.kix-paragraphrenderer .kix-lineview-text-block')) {
        const text = node.innerText?.trim(); if (text) lines.push(text);
      }
    }
    const sourceId = `docs:${id.documentId}:${id.documentTab}:${id.accountSlot}`;
    const body = exported?.id === sourceId ? exported.body : lines.join('\n');
    return {
      id: sourceId, app: 'docs', resourceId: `${id.documentId}:${id.documentTab}`,
      url: location.href, title, text: body ? `Document: ${title}\n\n${body}` : '', coverage: 'partial', editable: false,
      context: { ...id, adapter: exported?.id === sourceId ? 'authenticated-text-export' : 'canvas-annotations', renderedPages: document.querySelectorAll('.kix-page, .kix-page-paginated').length, annotationCount: candidates.length, exportScope: 'Document text export; multi-tab coverage not yet verified.', readPolicy: READ_POLICY, exportedAt: exported?.id === sourceId ? new Date(lastExportAt).toISOString() : null, saveIndicator: lastSaveState }
    };
  }
  async function readSnapshot(force = false) {
    checkSaveIndicator();
    const meta = extract();
    if (!meta) return null;
    if (Date.now() < retryReadAfter) throw new Error(lastReadError || 'Document reads are temporarily paused after a service error.');
    if (readInFlight) { await readInFlight; return extract(); }
    if (force || savedRefreshPending || exported?.id !== meta.id || Date.now() - lastExportAt >= IDLE_READ_INTERVAL) {
      const requestedSaveGeneration = saveGeneration;
      readInFlight = (async () => {
        try {
          const response = await LT.request({ type: 'docs-export', accountSlot: meta.context.accountSlot });
          const body = response.body.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n+$/, '');
          if (body.length > 100000) throw new Error('This document exceeds the prototype text limit.');
          exported = { id: meta.id, body };
          lastExportAt = Date.now();
          retryReadAfter = 0;
          lastReadError = '';
          if (requestedSaveGeneration === saveGeneration) savedRefreshPending = false;
        } catch (error) {
          retryReadAfter = Date.now() + (rateLimited(error) ? RATE_LIMIT_BACKOFF : 10000);
          lastReadError = error.message || String(error);
          throw error;
        }
      })();
      try { await readInFlight; } finally { readInFlight = null; }
    }
    return extract();
  }
  async function scan() {
    if (applying) return;
    if (!policyReported) {
      await LT.report({ app: 'docs', message: `Read policy active: ${READ_POLICY}.`, details: { readPolicy: READ_POLICY, idleReadIntervalMs: IDLE_READ_INTERVAL, rateLimitBackoffMs: RATE_LIMIT_BACKOFF, maxWriteVerificationExports: VERIFICATION_DELAYS.length } });
      policyReported = true;
    }
    checkSaveIndicator();
    if (Date.now() < retryReadAfter) return;
    let observation;
    try { observation = await readSnapshot(); }
    catch (error) {
      if (lastReportedReadError !== error.message) { lastReportedReadError = error.message; await LT.report({ app: 'docs', message: error.message, details: { readPolicy: READ_POLICY, retryReadAfter: new Date(retryReadAfter).toISOString() } }); }
      return [];
    }
    lastReportedReadError = '';
    if (!observation) return [];
    const capabilities = await LT.request({ type: 'capabilities' });
    observation.editable = !!capabilities.docsEditor;
    const diagnostic = JSON.stringify({ chars: observation.text.length, pages: observation.context.renderedPages, annotations: observation.context.annotationCount, editorEnabled: observation.editable, readPolicy: READ_POLICY });
    if (diagnostic !== lastDiagnostic) {
      lastDiagnostic = diagnostic;
      await LT.report({ app: 'docs', message: observation.text ? `Document text is available through ${observation.context.adapter}; coverage remains explicit.` : 'No document text is exposed by this access path yet.', details: JSON.parse(diagnostic), sourceId: observation.id });
    }
    if (observation.text) await LT.observe(observation);
    return observation.text ? [observation.id] : [];
  }
  async function key(key, code, modifiers = 0) {
    await LT.request({ type: 'debugger', method: 'Input.dispatchKeyEvent', params: { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : key === 'Escape' ? 27 : key === 'Enter' ? 13 : 0 } });
    await LT.request({ type: 'debugger', method: 'Input.dispatchKeyEvent', params: { type: 'keyUp', key, code, modifiers } });
  }
  function setInput(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  async function edit(action) {
    if (!action.sourceId?.startsWith('docs:')) return;
    if (applying) return { ok: false, inputAttempted: false, message: 'Another document edit is still being verified.' };
    let current;
    applying = true;
    let inputAttempted = false;
    let ownedDialog;
    try {
      if (checkSaveIndicator() === 'saving') return { ok: false, inputAttempted, message: 'Google Docs is still saving existing changes. Wait for it to finish, then review a fresh proposal.' };
      current = await readSnapshot(true);
      if (!current || current.id !== action.sourceId) return { ok: false, inputAttempted, message: 'The approved document is no longer the current editor.' };
      if (current.text !== action.expectedText) return { ok: false, inputAttempted, message: 'The document changed after the preview. Review a fresh proposal.' };
      if (!action.before || current.text.indexOf(action.before) !== current.text.lastIndexOf(action.before) || !current.text.includes(action.before)) return { ok: false, inputAttempted, message: 'The proposed text is not uniquely identified in the observed document.' };
      // Use Docs' own find-and-replace editor, not a visual DOM text replacement.
      document.querySelector('.kix-appview-editor')?.focus();
      await key('h', 'KeyH', 2);
      let dialog;
      for (let i = 0; i < 20; i++) {
        dialog = [...document.querySelectorAll('[role="dialog"]')].find(d => /find and replace|查找和替换|尋找與取代/i.test(d.innerText));
        if (dialog) break;
        await wait(100);
      }
      if (!dialog) return { ok: false, inputAttempted, message: 'The Google Docs replacement dialog could not be opened. No edit was made.' };
      ownedDialog = dialog;
      const inputs = [...dialog.querySelectorAll('input[type="text"], input:not([type])')].filter(n => n.getBoundingClientRect().width > 0);
      if (inputs.length < 2) return { ok: false, inputAttempted, message: 'The Google Docs replacement controls are not recognized. No edit was made.' };
      // A remembered regular-expression or accent-folding setting must not widen an exact edit.
      const checkboxes = [...dialog.querySelectorAll('input[type="checkbox"]')];
      if (checkboxes.length !== 3) return { ok: false, inputAttempted, message: 'The exact-match settings are not recognized. No edit was made.' };
      for (const [index, checked] of [true, false, false].entries()) {
        if (checkboxes[index].checked !== checked) checkboxes[index].click();
        if (checkboxes[index].checked !== checked) return { ok: false, inputAttempted, message: 'Exact-match settings could not be confirmed. No edit was made.' };
      }
      setInput(inputs[0], action.before); setInput(inputs[1], action.after);
      await wait(500);
      // Reject ambiguous document-wide matches, including matches outside rendered content.
      const text = dialog.innerText;
      const count = text.match(/(?:\bof\s+|\/\s*)(\d+)\b/i) || text.match(/(?:共|總共)\s*(\d+)/);
      if (!count || Number(count[1]) !== 1) return { ok: false, inputAttempted, message: 'Google Docs did not confirm one unique match. No edit was made.' };
      const replace = [...dialog.querySelectorAll('button, [role="button"]')].find(b => /^(replace|替换|取代)$/i.test(b.textContent.trim()));
      if (!replace || replace.getAttribute('aria-disabled') === 'true' || replace.disabled) return { ok: false, inputAttempted, message: 'The replacement action is unavailable. No edit was made.' };
      const saveBeforeInput = saveGeneration;
      inputAttempted = true;
      replace.click();
      dialog.querySelector('button[aria-label="Close"]')?.click();
      // Wait for this document's save chrome instead of repeatedly downloading the document.
      // A server export matching the exact result still verifies persistence if a very fast
      // Saving -> Saved transition was missed, provided the indicator is currently Saved.
      const inputAt = Date.now();
      while (Date.now() - inputAt < 8000) {
        const saved = checkSaveIndicator() === 'saved';
        if (saved && (saveGeneration > saveBeforeInput || Date.now() - inputAt >= 1500)) break;
        await wait(200);
      }
      let after;
      const verificationDeadline = inputAt + 27000;
      for (const delay of VERIFICATION_DELAYS) {
        if (delay) await wait(delay);
        // The worker caps each export at 8 seconds. Do not start a read that could
        // overrun the bounded verification window, even when prior requests were slow.
        if (verificationDeadline - Date.now() < 8500) break;
        after = await readSnapshot(true);
        if (after?.text === current.text.replace(action.before, action.after) && checkSaveIndicator() === 'saved') {
          after.editable = true;
          return { ok: true, inputAttempted, message: 'Google Docs shows the exact approved result in its saved text export and reports it saved to Drive.', observation: after };
        }
      }
      return { ok: false, inputAttempted, status: 'uncertain', message: 'The edit was attempted, but a saved result could not be verified. Check the document before retrying.', observation: after || current };
    } catch (error) { return { ok: false, inputAttempted, ...(inputAttempted ? { status: 'uncertain' } : {}), message: inputAttempted ? `The edit was attempted, but ${rateLimited(error) ? 'Google Docs rate-limited verification. Reads will pause for 60 seconds.' : 'verification failed.'} Check the document before retrying.` : error.message }; }
    finally {
      if (ownedDialog?.isConnected) ownedDialog.querySelector('button[aria-label="Close"]')?.click();
      applying = false;
      await scan().catch(() => {});
    }
  }
  checkSaveIndicator();
  const saveObserver = new MutationObserver(() => checkSaveIndicator());
  saveObserver.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] });
  LT.registerAdapter({ app: 'docs', scan });
  LT.onAction(edit);
})();
