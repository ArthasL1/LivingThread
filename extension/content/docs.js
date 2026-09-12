(() => {
  const LT = globalThis.LivingThread;
  if (!LT) return;
  let lastDiagnostic = '';
  let applying = false;
  let exported = null;
  let lastExportAt = 0;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
      context: { ...id, adapter: exported?.id === sourceId ? 'authenticated-text-export' : 'canvas-annotations', renderedPages: document.querySelectorAll('.kix-page, .kix-page-paginated').length, annotationCount: candidates.length, exportScope: 'Document text export; multi-tab coverage not yet verified.' }
    };
  }
  async function readSnapshot(force = false) {
    const meta = extract();
    if (!meta) return null;
    if (force || exported?.id !== meta.id || Date.now() - lastExportAt > 5000) {
      const url = new URL(`/document/d/${encodeURIComponent(meta.context.documentId)}/export`, location.origin);
      url.searchParams.set('format', 'txt');
      if (meta.context.documentTab !== 'default') url.searchParams.set('tab', meta.context.documentTab);
      if (meta.context.accountSlot) url.searchParams.set('authuser', meta.context.accountSlot);
      const response = await fetch(url, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok || !/text\/plain|application\/octet-stream/.test(response.headers.get('content-type') || '')) throw new Error('Google Docs did not provide an authenticated plain-text export.');
      const body = (await response.text()).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n+$/, '');
      if (body.length > 100000) throw new Error('This document exceeds the prototype text limit.');
      exported = { id: meta.id, body };
      lastExportAt = Date.now();
    }
    return extract();
  }
  async function scan() {
    if (applying) return;
    let observation;
    try { observation = await readSnapshot(); }
    catch (error) { await LT.report({ app: 'docs', message: error.message }); return []; }
    if (!observation) return [];
    const capabilities = await LT.request({ type: 'capabilities' });
    observation.editable = !!capabilities.docsEditor;
    const diagnostic = JSON.stringify({ chars: observation.text.length, pages: observation.context.renderedPages, annotations: observation.context.annotationCount, editorEnabled: observation.editable });
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
    let current;
    try { current = await readSnapshot(true); } catch (error) { return { ok: false, message: error.message }; }
    if (!current || current.id !== action.sourceId) return;
    if (current.text !== action.expectedText) return { ok: false, message: 'The document changed after the preview. Review a fresh proposal.' };
    if (!action.before || current.text.indexOf(action.before) !== current.text.lastIndexOf(action.before) || !current.text.includes(action.before)) return { ok: false, message: 'The proposed text is not uniquely identified in the observed document.' };
    applying = true;
    let editAttempted = false;
    let ownedDialog;
    try {
      // Use Docs' own find-and-replace editor, not a visual DOM text replacement.
      document.querySelector('.kix-appview-editor')?.focus();
      await key('h', 'KeyH', 2);
      let dialog;
      for (let i = 0; i < 20; i++) {
        dialog = [...document.querySelectorAll('[role="dialog"]')].find(d => /find and replace|查找和替换|尋找與取代/i.test(d.innerText));
        if (dialog) break;
        await wait(100);
      }
      if (!dialog) return { ok: false, message: 'The Google Docs replacement dialog could not be opened. No edit was made.' };
      ownedDialog = dialog;
      const inputs = [...dialog.querySelectorAll('input[type="text"], input:not([type])')].filter(n => n.getBoundingClientRect().width > 0);
      if (inputs.length < 2) return { ok: false, message: 'The Google Docs replacement controls are not recognized. No edit was made.' };
      // A remembered regular-expression or accent-folding setting must not widen an exact edit.
      const checkboxes = [...dialog.querySelectorAll('input[type="checkbox"]')];
      if (checkboxes.length !== 3) return { ok: false, message: 'The exact-match settings are not recognized. No edit was made.' };
      for (const [index, checked] of [true, false, false].entries()) {
        if (checkboxes[index].checked !== checked) checkboxes[index].click();
        if (checkboxes[index].checked !== checked) return { ok: false, message: 'Exact-match settings could not be confirmed. No edit was made.' };
      }
      setInput(inputs[0], action.before); setInput(inputs[1], action.after);
      await wait(500);
      // Reject ambiguous document-wide matches, including matches outside rendered content.
      const text = dialog.innerText;
      const count = text.match(/(?:\bof\s+|\/\s*)(\d+)\b/i) || text.match(/(?:共|總共)\s*(\d+)/);
      if (!count || Number(count[1]) !== 1) return { ok: false, message: 'Google Docs did not confirm one unique match. No edit was made.' };
      const replace = [...dialog.querySelectorAll('button, [role="button"]')].find(b => /^(replace|替换|取代)$/i.test(b.textContent.trim()));
      if (!replace || replace.getAttribute('aria-disabled') === 'true' || replace.disabled) return { ok: false, message: 'The replacement action is unavailable. No edit was made.' };
      editAttempted = true;
      replace.click();
      dialog.querySelector('button[aria-label="Close"]')?.click();
      let after;
      for (let i = 0; i < 12; i++) {
        await wait(750); after = await readSnapshot(true);
        if (after?.text === current.text.replace(action.before, action.after)) {
          const indicators = [...document.querySelectorAll('[aria-label], [title]')].map(n => `${n.getAttribute('aria-label') || ''} ${n.getAttribute('title') || ''}`);
          if (indicators.some(s => /saved to drive|all changes saved|所有更改.*保存|已保存到云端|已儲存到雲端/i.test(s))) {
            after.editable = true;
            return { ok: true, message: 'Google Docs shows the expected change and reports it saved to Drive.', observation: after };
          }
        }
      }
      return { ok: false, status: 'uncertain', message: 'The edit was attempted, but a saved result could not be verified. Check the document before retrying.', observation: after || current };
    } catch (error) { return { ok: false, ...(editAttempted ? { status: 'uncertain' } : {}), message: editAttempted ? 'The edit was attempted, but verification failed. Check the document before retrying.' : error.message }; }
    finally {
      if (ownedDialog?.isConnected) ownedDialog.querySelector('button[aria-label="Close"]')?.click();
      applying = false;
      await scan().catch(() => {});
    }
  }
  LT.registerAdapter({ app: 'docs', scan });
  LT.onAction(edit);
})();
