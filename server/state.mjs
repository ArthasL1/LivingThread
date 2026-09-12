import { createHash, randomUUID } from 'node:crypto';

export const versionOf = text => createHash('sha256').update(text).digest('hex');
export const exactOnce = (text, part) => !!part && text.indexOf(part) >= 0 && text.indexOf(part) === text.lastIndexOf(part);

// Model labels and explanatory wording are not the identity of a proposed action.
const actionSignature = action => ['kind', 'sourceId', 'before', 'after', 'text', 'channelId', 'threadTs'].map(field => action[field] || '');
const canonicalEntries = entries => entries.map(entry => JSON.stringify(entry)).sort();

export function validateObservation(value) {
  if (!value || !['gmail', 'docs', 'slack'].includes(value.app)) throw new Error('Unsupported observation.');
  for (const field of ['id', 'resourceId', 'url', 'title', 'text']) if (typeof value[field] !== 'string') throw new Error(`Observation ${field} is required.`);
  if (value.text.length > 100000) throw new Error('Observation exceeds the current text limit.');
  const url = new URL(value.url);
  const expected = { gmail: ['mail.google.com'], docs: ['docs.google.com'], slack: ['app.slack.com', 'slack.com'] }[value.app];
  if (url.protocol !== 'https:' || !(expected.includes(url.hostname) || (value.app === 'slack' && url.hostname.endsWith('.slack.com')))) throw new Error('Observation URL does not match its application.');
  return {
    id: value.id.slice(0, 400), app: value.app, resourceId: value.resourceId.slice(0, 400),
    url: value.url, title: value.title.slice(0, 500), text: value.text,
    observedAt: new Date().toISOString(), coverage: ['full', 'visible', 'partial'].includes(value.coverage) ? value.coverage : 'partial',
    editable: value.editable === true, account: typeof value.account === 'string' ? value.account.slice(0, 300) : '',
    context: value.context && typeof value.context === 'object' ? value.context : {},
    ...(Number.isInteger(value.tabId) ? { tabId: value.tabId } : {}),
    version: versionOf(value.text), lastSeenAt: new Date().toISOString(), stale: false
  };
}

export class WorkState {
  session = { enabled: false };
  observations = new Map();
  findings = [];
  operations = [];
  commands = [];
  diagnostics = [];
  clarifications = [];
  dismissed = new Set();
  checking = false;
  error = '';
  revision = 0;
  slack = { state: 'unconfigured', configured: false };
  #replacementChecks = new Map();

  snapshot() {
    return { session: this.session, observations: [...this.observations.values()], findings: this.findings, operations: this.operations.slice(-50), diagnostics: this.diagnostics.slice(-20), checking: this.checking, error: this.error, slack: this.slack, revision: this.revision };
  }
  observe(input) {
    if (!this.session.enabled) return false;
    const value = validateObservation(input);
    const old = this.observations.get(value.id);
    if (value.context.deleted || (value.app === 'slack' && !value.text.trim())) {
      this.observations.delete(value.id);
      this.findings = this.findings.filter(f => !f.evidence.some(e => e.sourceId === value.id));
      this.revision++;
      return true;
    }
    if (!value.text.trim()) return false;
    const changed = !old || old.version !== value.version || old.stale || old.editable !== value.editable;
    if (!changed) value.observedAt = old.observedAt;
    this.observations.set(value.id, value);
    if (changed) {
      this.revision++;
      this.findings = this.findings.filter(f => !f.evidence.some(e => e.sourceId === value.id));
    }
    return changed;
  }
  close(tabId, activeIds) {
    let changed = false;
    const removed = new Set();
    for (const [id, observation] of this.observations) {
      if (observation.tabId !== tabId || activeIds?.includes(id)) continue;
      // Composer IDs belong to one page lifetime; retaining closed drafts invents duplicate sources after reload.
      if (observation.app === 'gmail') {
        this.observations.delete(id);
        removed.add(id);
        changed = true;
        continue;
      }
      if (observation.stale) continue;
      this.observations.set(id, { ...observation, stale: true, editable: false });
      changed = true;
    }
    if (removed.size) this.findings = this.findings.filter(finding => !finding.evidence.some(e => removed.has(e.sourceId)));
    for (const finding of this.findings) {
      finding.actions = finding.actions.filter(a => {
        const source = this.observations.get(a.sourceId);
        return source && !source.stale;
      });
    }
    if (changed) this.revision++;
    return changed;
  }
  fingerprint(finding) {
    return versionOf(JSON.stringify({
      kind: finding.kind,
      evidence: canonicalEntries(finding.evidence.map(e => [e.sourceId, this.observations.get(e.sourceId)?.version || '', e.quote, e.role || ''])),
      actions: canonicalEntries((finding.actions || []).map(actionSignature))
    }));
  }
  acceptFindings(findings) {
    const accepted = [];
    for (const finding of findings) {
      if (!Array.isArray(finding.evidence) || finding.evidence.length < 2) continue;
      if (!finding.evidence.every(e => this.observations.get(e.sourceId)?.text.includes(e.quote) && e.quote.trim())) continue;
      const id = this.fingerprint(finding);
      if (this.dismissed.has(id)) continue;
      const actions = [];
      for (const action of finding.actions || []) {
        const source = this.observations.get(action.sourceId);
        if (!source || source.stale) continue;
        if (action.kind === 'replace_text' && (!source.editable || !exactOnce(source.text, action.before) || action.before === action.after)) continue;
        if (action.kind === 'slack_message' && (source.app !== 'slack' || action.channelId !== source.context.channelId || action.threadTs !== (source.context.threadTs || source.context.messageTs || '') || !action.text?.trim())) continue;
        if (!['replace_text', 'slack_message'].includes(action.kind)) continue;
        actions.push({ ...action, id: versionOf(id + JSON.stringify(actionSignature(action))).slice(0, 24), expectedVersion: source.version, expectedText: source.text });
      }
      accepted.push({ ...finding, id, actions, status: 'open' });
    }
    this.findings = accepted;
  }
  approve(findingId, actionIds) {
    if (!this.session.enabled) throw new Error('Start a work session before applying changes.');
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) throw new Error('The evidence changed. Review the current finding.');
    if (!Array.isArray(actionIds) || !actionIds.length || new Set(actionIds).size !== actionIds.length) throw new Error('Select specific actions to approve.');
    const actions = actionIds.map(id => finding.actions.find(a => a.id === id));
    if (actions.some(a => !a)) throw new Error('An approved action is no longer available.');
    for (const action of actions) {
      const source = this.observations.get(action.sourceId);
      if (!source || source.stale || source.version !== action.expectedVersion) throw new Error('A target changed after the preview. Check the latest evidence.');
      if (this.operations.some(o => o.actionId === action.id && ['queued', 'running', 'succeeded', 'uncertain'].includes(o.status))) throw new Error('This action is already queued or was attempted. Inspect its result before retrying.');
      if (action.kind === 'replace_text' && !Number.isInteger(source.tabId)) throw new Error('The target editor is not open.');
    }
    return actions.map(action => {
      const operation = { id: randomUUID(), actionId: action.id, findingId, sourceId: action.sourceId, kind: action.kind, status: 'queued', message: 'Approved; waiting to execute.', createdAt: new Date().toISOString() };
      this.operations.push(operation);
      if (action.kind === 'replace_text') {
        const source = this.observations.get(action.sourceId);
        this.#replacementChecks.set(operation.id, {
          sourceId: source.id, app: source.app, resourceId: source.resourceId, tabId: source.tabId,
          expectedText: action.expectedText.replace(action.before, action.after)
        });
        this.commands.push({ operationId: operation.id, tabId: source.tabId, action });
      }
      return { operation, action };
    });
  }
  takeCommands() {
    if (!this.session.enabled) return [];
    const commands = this.commands.splice(0);
    const accepted = [];
    for (const command of commands) {
      const operation = this.operations.find(o => o.id === command.operationId);
      const source = this.observations.get(command.action.sourceId);
      if (!source || source.stale || source.version !== command.action.expectedVersion) {
        operation.status = 'failed'; operation.message = 'The target changed before execution; no edit was attempted.';
        this.#replacementChecks.delete(operation.id);
      } else { operation.status = 'running'; operation.startedAt = Date.now(); accepted.push(command); }
    }
    return accepted;
  }
  result(operationId, result) {
    const operation = this.operations.find(o => o.id === operationId);
    if (!operation || operation.status !== 'running') throw new Error('Unknown or completed operation.');
    const check = this.#replacementChecks.get(operationId);
    const source = this.observations.get(operation.sourceId);
    const identity = check || source;
    let observation;
    if (result?.observation && result.observation.id === operation.sourceId
      && result.observation.app === identity?.app && result.observation.resourceId === identity?.resourceId) {
      try { observation = validateObservation(result.observation); } catch { /* An invalid observation cannot verify a write. */ }
    }
    const verified = operation.kind !== 'replace_text' || (check && observation?.text === check.expectedText);
    operation.status = result?.status === 'uncertain' ? 'uncertain'
      : result?.ok === true ? verified ? 'succeeded' : 'uncertain' : 'failed';
    operation.message = String(result?.message || 'The adapter did not return a verification result.').slice(0, 1000);
    if (result?.ok === true && !verified && result?.status !== 'uncertain') {
      operation.message = 'The adapter reported an edit, but its returned source and text did not verify the approved change. Check the target before retrying.';
    }
    operation.finishedAt = new Date().toISOString();
    this.#replacementChecks.delete(operationId);
    // A late result may complete an operation, but cannot reopen a composer removed by presence tracking.
    if (observation && (observation.app !== 'gmail' || source)) {
      this.observe({ ...observation, tabId: source?.tabId ?? check?.tabId });
    }
    return operation;
  }
  sweep() {
    for (const operation of this.operations) {
      if (operation.status === 'running' && Date.now() - operation.startedAt > 45000) { operation.status = 'uncertain'; operation.message = 'No verification result arrived. Check the target before retrying.'; this.#replacementChecks.delete(operation.id); }
    }
  }
}
