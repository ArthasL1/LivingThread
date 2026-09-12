(() => {
  'use strict';

  const LT = globalThis.LivingThread;
  if (!LT) return;

  const BLOCKS = new Set(['DIV', 'P', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'H1', 'H2', 'H3', 'H4', 'TABLE', 'TR']);
  const SAVE_TEXT = /saved to drafts|draft saved|all changes saved|已保存.{0,8}草稿|草稿已保存/i;
  const composers = new Map();
  const identities = new WeakMap();
  const pageId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let sequence = 0;

  function textMap(root) {
    let text = '';
    const runs = [];
    function newline() { if (text && !text.endsWith('\n')) text += '\n'; }
    function visit(node) {
      if (node.nodeType === 3) {
        const value = (node.nodeValue || '').replace(/\u00a0/g, ' ');
        runs.push({ node, start: text.length, end: text.length + value.length });
        text += value;
        return;
      }
      if (node.nodeType !== 1) return;
      if (node.hasAttribute?.('data-livingthread') || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) return;
      if (node.hidden || node.getAttribute?.('aria-hidden') === 'true') return;
      if (node !== root && globalThis.getComputedStyle) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return;
      }
      if (node.tagName === 'BR') { text += '\n'; return; }
      const block = node !== root && BLOCKS.has(node.tagName);
      if (block) newline();
      for (const child of node.childNodes || []) visit(child);
      if (block) newline();
    }
    visit(root);
    text = text.replace(/\n+$/, '');
    return { text, runs };
  }

  function pointAt(runs, offset, end = false) {
    if (!runs.length) return null;
    const exact = runs.find(run => end ? run.start < offset && run.end >= offset : run.start <= offset && run.end > offset);
    if (exact) return { node: exact.node, offset: offset - exact.start };
    if (end) {
      const previous = [...runs].reverse().find(run => run.end <= offset);
      if (previous) return { node: previous.node, offset: previous.end - previous.start };
    } else {
      const next = runs.find(run => run.start >= offset);
      if (next) return { node: next.node, offset: 0 };
    }
    const last = runs[runs.length - 1];
    return { node: last.node, offset: last.end - last.start };
  }

  function composeText(subject, body) { return `Subject: ${subject}\n\n${body}`; }

  function planReplacement(action, subject, body) {
    const current = composeText(subject, body);
    if (typeof action.expectedText !== 'string' || action.expectedText !== current) {
      return { error: 'This draft changed after the preview. Check it again before applying an update.' };
    }
    if (typeof action.before !== 'string' || !action.before || typeof action.after !== 'string' || action.before === action.after) {
      return { error: 'The proposed replacement is empty or unchanged.' };
    }
    const index = current.indexOf(action.before);
    if (index < 0 || current.indexOf(action.before, index + 1) >= 0) {
      return { error: 'The original text no longer identifies one exact location in this draft.' };
    }
    const bodyStart = composeText(subject, '').length;
    const subjectStart = 'Subject: '.length;
    if (index >= bodyStart) {
      return { field: 'body', index: index - bodyStart, expected: body.slice(0, index - bodyStart) + action.after + body.slice(index - bodyStart + action.before.length) };
    }
    if (index >= subjectStart && index + action.before.length <= subjectStart + subject.length && !/[\r\n]/.test(action.after)) {
      return { field: 'subject', index: index - subjectStart, expected: subject.slice(0, index - subjectStart) + action.after + subject.slice(index - subjectStart + action.before.length) };
    }
    return { error: 'This change crosses the subject and body boundary. Request separate, smaller edits.' };
  }

  if (globalThis.__LIVINGTHREAD_TEST__) {
    globalThis.__LIVINGTHREAD_TEST__.gmail = { textMap, pointAt, composeText, planReplacement, watchSave };
    return;
  }

  function accountSlot() { return location.pathname.match(/\/mail\/u\/([^/]+)/)?.[1] || '0'; }
  function isVisible(element) { return element.isConnected && !!element.getClientRects().length; }

  function findComposers() {
    const active = new Map();
    const editors = document.querySelectorAll('[contenteditable="true"][g_editable="true"], [contenteditable="true"][role="textbox"][aria-multiline="true"]');
    for (const editor of editors) {
      if (editor.closest('[data-livingthread]') || !isVisible(editor)) continue;
      // Gmail's message body is g_editable. Restrict the fallback to a composer dialog.
      const dialog = editor.closest('[role="dialog"]');
      if (!editor.hasAttribute('g_editable') && !dialog) continue;
      const root = dialog || editor.closest('form') || editor.parentElement;
      let localId = identities.get(editor);
      if (!localId) {
        localId = `${pageId}-${++sequence}`;
        identities.set(editor, localId);
      }
      const id = `gmail:${accountSlot()}:${localId}`;
      const subjectInput = root?.querySelector('input[name="subjectbox"], input[name="subject"]');
      const composer = { id, editor, root, subjectInput };
      active.set(id, composer);
    }
    composers.clear();
    for (const [id, composer] of active) composers.set(id, composer);
    return active;
  }

  function snapshot(composer) {
    const subject = composer.subjectInput?.value || '';
    const body = textMap(composer.editor).text;
    return {
      id: composer.id,
      app: 'gmail',
      resourceId: composer.id,
      url: `${location.origin}/mail/u/${encodeURIComponent(accountSlot())}/#drafts`,
      title: subject || 'Untitled email draft',
      text: composeText(subject, body),
      observedAt: new Date().toISOString(),
      coverage: 'full',
      editable: composer.editor.getAttribute('contenteditable') === 'true',
      context: { accountSlot: accountSlot(), surface: 'open_composer', subject, body, pageId },
    };
  }

  async function scan() {
    const active = findComposers();
    for (const composer of active.values()) {
      const observation = snapshot(composer);
      if (observation.context.subject.trim() || observation.context.body.trim()) await LT.observe(observation);
    }
    return [...active.keys()];
  }

  function statusText(element) {
    return [element.textContent || '', element.getAttribute?.('aria-label') || '', element.getAttribute?.('data-tooltip') || '', element.getAttribute?.('title') || ''].join(' ').trim();
  }

  function watchSave(composer) {
    let confirmed = false;
    function inspect(element) {
      if (!element || element.nodeType !== 1 || element.closest?.('[data-livingthread]')) return;
      // Content can quote words such as "Draft saved". Only application chrome is a save signal.
      if (!composer.root?.contains(element) || composer.editor.contains(element) || element.contains(composer.editor) || element === composer.subjectInput) return;
      const value = statusText(element);
      if (value.length <= 160 && SAVE_TEXT.test(value)) confirmed = true;
    }
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
        inspect(element);
        // Some Gmail versions replace a status element rather than update its label.
        for (const added of mutation.addedNodes || []) {
          if (added.nodeType !== 1) continue;
          inspect(added);
          for (const child of added.querySelectorAll?.('[role="status"], [aria-label], [data-tooltip]') || []) inspect(child);
        }
      }
    });
    observer.observe(composer.root || composer.editor, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'data-tooltip', 'title'] });
    return {
      hasConfirmed: () => confirmed,
      stop: () => observer.disconnect(),
    };
  }

  function dispatchEdit(element, text) {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function apply(action) {
    if (action.kind !== 'replace_text') return { ok: false, message: 'Gmail supports reviewed draft edits only.' };
    if (!LT.getState()?.session?.enabled) return { ok: false, message: 'Start the work session before editing a draft.' };
    findComposers();
    const composer = composers.get(action.sourceId);
    if (!composer || !isVisible(composer.editor)) return { ok: false, message: 'This draft is no longer open. Reopen it and check again.' };
    const beforeSnapshot = snapshot(composer);
    const subject = beforeSnapshot.context.subject;
    const body = beforeSnapshot.context.body;
    const plan = planReplacement(action, subject, body);
    if (plan.error) return { ok: false, message: plan.error, observation: beforeSnapshot };

    const activeElement = document.activeElement;
    const selection = window.getSelection();
    const priorRanges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    const save = watchSave(composer);
    let edited = false;
    try {
      if (plan.field === 'subject') {
        if (!composer.subjectInput) return { ok: false, message: 'This composer does not expose an editable subject.' };
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (!setter) return { ok: false, message: 'This browser does not expose the input setter needed for this edit.' };
        setter.call(composer.subjectInput, plan.expected);
        dispatchEdit(composer.subjectInput, action.after);
        edited = true;
      } else {
        const map = textMap(composer.editor);
        const start = pointAt(map.runs, plan.index);
        const end = pointAt(map.runs, plan.index + action.before.length, true);
        if (!start || !end) return { ok: false, message: 'The exact text could not be located in the editor. Nothing was changed.' };
        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        composer.editor.focus({ preventScroll: true });
        selection.removeAllRanges();
        selection.addRange(range);
        // Native editing preserves the surrounding markup and participates in the editor's undo history.
        // Do not fall back to innerHTML/textContent: that would only prove a DOM mutation, not an application edit.
        const accepted = document.execCommand('insertText', false, action.after);
        if (!accepted) return { ok: false, message: 'Gmail did not accept the browser editing command. Nothing was confirmed saved.' };
        dispatchEdit(composer.editor, action.after);
        edited = true;
      }

      const startTime = Date.now();
      let stableSince = 0;
      while (Date.now() - startTime < 6500) {
        await new Promise(resolve => setTimeout(resolve, 180));
        if (!composer.editor.isConnected) return { ok: false, edited, status: 'uncertain', message: 'The composer closed during the edit. Its saved state could not be verified.' };
        const current = snapshot(composer);
        const matches = current.context[plan.field] === plan.expected;
        const otherUnchanged = plan.field === 'body' ? current.context.subject === subject : current.context.body === body;
        if (!matches || !otherUnchanged) {
          return { ok: false, edited, status: 'uncertain', message: 'The editor contents differ from the approved result. Review this draft before continuing.', observation: current };
        }
        if (!stableSince) stableSince = Date.now();
        if (save.hasConfirmed() && Date.now() - stableSince >= 700) {
          await LT.observe(current);
          return { ok: true, message: 'Draft updated. Gmail confirmed it was saved.', observation: current };
        }
      }
      const current = snapshot(composer);
      await LT.observe(current);
      return { ok: false, edited: true, status: 'uncertain', message: 'The approved text is in the editor, but Gmail save confirmation was not detected. Review the draft before retrying.', observation: current };
    } catch (error) {
      return { ok: false, edited, ...(edited ? { status: 'uncertain' } : {}), message: edited ? 'The draft was edited, but verification was interrupted. Check its contents before retrying.' : 'The draft could not be edited. Check that the composer is still available.' };
    } finally {
      save.stop();
      // Return focus without stealing it if the user moved to another control during verification.
      if (document.activeElement === composer.editor && activeElement?.isConnected && activeElement !== composer.editor) activeElement.focus?.({ preventScroll: true });
      if (selection && document.activeElement === activeElement && activeElement === composer.editor && priorRanges.every(range => range.startContainer.isConnected && range.endContainer.isConnected)) {
        selection.removeAllRanges();
        for (const range of priorRanges) selection.addRange(range);
      }
    }
  }

  LT.registerAdapter({ app: 'gmail', scan });
  LT.onAction(apply);
  // The shared UI can anchor the notice to the draft that the agent is discussing.
  LT.getAnchor = sourceId => composers.get(sourceId)?.root || composers.get(sourceId)?.editor || null;
})();
