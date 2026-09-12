import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkState } from '../server/state.mjs';

function setup() {
  const state = new WorkState(); state.session.enabled = true;
  state.observe({ id: 'doc', app: 'docs', resourceId: 'doc', url: 'https://docs.google.com/document/d/test/edit', title: 'Atlas', text: 'Atlas is on the third floor.', coverage: 'partial', editable: true, tabId: 12 });
  state.observe({ id: 'mail', app: 'gmail', resourceId: 'mail', url: 'https://mail.google.com/mail/u/1/#drafts', title: 'Atlas', text: 'Atlas is on the third floor.', coverage: 'full', editable: true, tabId: 13 });
  const finding = { event: 'Atlas', kind: 'conflict', summary: 'Venue changed', evidence: [{sourceId:'doc',quote:'third floor',role:'outdated'}, {sourceId:'mail',quote:'third floor',role:'outdated'}], actions: ['doc','mail'].map(sourceId => ({kind:'replace_text',sourceId,before:'third floor',after:'fifth floor'})) };
  state.acceptFindings([finding]);
  return state;
}
test('paused sessions do not collect observations', () => {
  const state = setup(); state.session.enabled = false;
  assert.equal(state.observe({...state.observations.get('doc'), text:'Changed'}),false);
  assert.equal(state.observations.get('doc').text,'Atlas is on the third floor.');
});
test('changed targets invalidate existing proposals before an approval', () => {
  const state = setup(), finding = state.findings[0];
  state.observe({...state.observations.get('doc'),text:'Atlas is postponed.'});
  assert.throws(() => state.approve(finding.id,[finding.actions[0].id]),/evidence changed/);
});
test('an approved group reports each outcome and prevents duplicate attempts', () => {
  const state=setup(), finding=state.findings[0];
  state.approve(finding.id,finding.actions.map(a=>a.id));
  assert.throws(()=>state.approve(finding.id,[finding.actions[0].id]),/already queued/);
  const commands=state.takeCommands();
  state.result(commands[0].operationId,{ok:false,message:'Document is unavailable.'});
  state.result(commands[1].operationId,{ok:true,message:'Draft save verified.',observation:{...state.observations.get('mail'),text:'Atlas is on the fifth floor.'}});
  assert.deepEqual(state.operations.map(o=>o.status),['failed','succeeded']);
});
test('an editor closing makes its snapshot stale and withholds queued writes', () => {
  const state=setup(),finding=state.findings[0];
  state.approve(finding.id,[finding.actions[0].id]);
  state.close(12);
  assert.equal(state.observations.get('doc').stale,true);
  assert.deepEqual(state.takeCommands(),[]);
  assert.equal(state.operations[0].status,'failed');
});
test('a missing verification result remains uncertain and cannot be replayed', () => {
  const state=setup(),finding=state.findings[0];
  state.approve(finding.id,[finding.actions[0].id]);state.takeCommands();
  state.operations[0].startedAt=Date.now()-46000;state.sweep();
  assert.equal(state.operations[0].status,'uncertain');
  assert.throws(()=>state.approve(finding.id,[finding.actions[0].id]),/already queued/);
});
test('deletion removes source evidence; unrelated URL origins are rejected', () => {
  const state=setup();
  assert.throws(()=>state.observe({...state.observations.get('doc'),url:'https://attacker.example/doc'}),/URL/);
  state.observe({...state.observations.get('doc'),text:'',context:{deleted:true}});
  assert.equal(state.observations.has('doc'),false);assert.equal(state.findings.length,0);
});

test('different issues sharing every source and version retain independent finding IDs', () => {
  const state = setup();
  for (const id of ['doc', 'mail']) state.observe({ ...state.observations.get(id), text: 'Atlas is on the third floor at 15:00.' });
  const evidence = ['doc', 'mail'].map(sourceId => ({ sourceId, quote: 'Atlas is on the third floor at 15:00.', role: 'outdated' }));
  const venue = { event: 'Atlas', kind: 'conflict', evidence, actions: [{ kind: 'replace_text', sourceId: 'mail', before: 'third floor', after: 'fifth floor' }] };
  const time = { event: 'Atlas', kind: 'conflict', evidence, actions: [{ kind: 'replace_text', sourceId: 'mail', before: '15:00', after: '16:00' }] };
  state.acceptFindings([venue, time]);
  assert.equal(state.findings.length, 2);
  assert.notEqual(state.findings[0].id, state.findings[1].id);
  const timeId = state.findings[1].id;
  state.dismissed.add(state.findings[0].id);
  state.acceptFindings([venue, time]);
  assert.equal(state.findings.length, 1);
  assert.equal(state.findings[0].id, timeId);
});

test('grounded quotes distinguish issues even when neither issue has an action', () => {
  const state = setup();
  for (const id of ['doc', 'mail']) state.observe({ ...state.observations.get(id), text: 'Atlas is on the third floor at 15:00.' });
  const findings = ['third floor', '15:00'].map(quote => ({ kind: 'conflict', actions: [],
    evidence: ['doc', 'mail'].map(sourceId => ({ sourceId, quote, role: 'context' })) }));
  state.acceptFindings(findings);
  assert.notEqual(state.findings[0].id, state.findings[1].id);
});

test('finding and action IDs survive model label, prose, and ordering changes', () => {
  const state = setup();
  const original = structuredClone(state.findings[0]);
  const actionIds = Object.fromEntries(original.actions.map(action => [action.sourceId, action.id]));
  const rephrased = { ...original, id: 'new model finding ID', event: 'Atlas customer demonstration',
    summary: 'Reworded summary', explanation: 'New explanation', confidence: 0.9,
    evidence: [...original.evidence].reverse(),
    actions: [...original.actions].reverse().map(action => ({ ...action, id: 'new model action ID' })) };
  state.acceptFindings([rephrased]);
  assert.equal(state.findings[0].id, original.id);
  assert.deepEqual(Object.fromEntries(state.findings[0].actions.map(action => [action.sourceId, action.id])), actionIds);
});

function runningReplacement() {
  const state = setup();
  const finding = state.findings[0];
  state.approve(finding.id, [finding.actions[0].id]);
  const [command] = state.takeCommands();
  const observation = { ...state.observations.get('doc'), text: 'Atlas is on the fifth floor.' };
  return { state, command, observation, finding };
}

test('a replacement succeeds only after its exact approved output is returned', () => {
  const { state, command, observation } = runningReplacement();
  const operation = state.result(command.operationId, { ok: true, message: 'Saved.', observation });
  assert.equal(operation.status, 'succeeded');
  assert.equal(state.observations.get('doc').text, 'Atlas is on the fifth floor.');
});

test('missing, wrong-source, wrong-app, or different replacement output cannot report success', () => {
  const mutations = [
    () => undefined,
    observation => ({ ...observation, id: 'mail' }),
    observation => ({ ...observation, app: 'gmail', url: 'https://mail.google.com/mail/u/1/#drafts' }),
    observation => ({ ...observation, resourceId: 'another-document' }),
    observation => ({ ...observation, text: 'Atlas is on the third floor.' }),
    observation => ({ ...observation, text: 'Atlas is on the fifth floor. Unapproved extra text.' }),
    observation => ({ ...observation, url: 'https://attacker.example/doc' })
  ];
  for (const mutate of mutations) {
    const { state, command, observation } = runningReplacement();
    const operation = state.result(command.operationId, { ok: true, message: 'Saved.', observation: mutate(observation) });
    assert.equal(operation.status, 'uncertain');
    assert.match(operation.message, /did not verify/);
    assert.notEqual(operation.message, 'Saved.');
  }
});

test('an adapter uncertain result takes priority over ok and exact returned text', () => {
  for (const ok of [true, false]) {
    const { state, command, observation } = runningReplacement();
    const operation = state.result(command.operationId, { ok, status: 'uncertain', message: 'Editor changed, but save is unconfirmed.', observation });
    assert.equal(operation.status, 'uncertain');
    assert.equal(operation.message, 'Editor changed, but save is unconfirmed.');
  }
});

test('verification uses the approved operation after the original finding disappears', () => {
  const { state, command, observation } = runningReplacement();
  state.observe(observation);
  assert.equal(state.findings.length, 0);
  command.action.after = 'unapproved floor';
  const operation = state.result(command.operationId, { ok: true, observation });
  assert.equal(operation.status, 'succeeded');
});

test('Slack success remains valid without a replacement observation', () => {
  const state = setup();
  state.observe({ id: 'slack', app: 'slack', resourceId: '123', url: 'https://app.slack.com/client/T/C',
    title: 'Atlas', text: 'Can Alex confirm the venue?', coverage: 'full', editable: false,
    context: { channelId: 'C', threadTs: '123' } });
  state.acceptFindings([{ kind: 'pending',
    evidence: [{ sourceId: 'slack', quote: 'Can Alex confirm the venue?', role: 'proposal' }, { sourceId: 'doc', quote: 'third floor', role: 'context' }],
    actions: [{ kind: 'slack_message', sourceId: 'slack', channelId: 'C', threadTs: '123', text: 'The venue remains pending confirmation.' }] }]);
  const finding = state.findings[0];
  const [{ operation }] = state.approve(finding.id, [finding.actions[0].id]);
  operation.status = 'running';
  assert.equal(state.result(operation.id, { ok: true, message: 'Slack accepted the message.' }).status, 'succeeded');
});

test('closing a Gmail tab removes its composers and findings but retains the operation journal', () => {
  const state = setup();
  const finding = state.findings[0];
  const mailAction = finding.actions.find(action => action.sourceId === 'mail');
  const [{ operation }] = state.approve(finding.id, [mailAction.id]);
  const revision = state.revision;
  assert.equal(state.close(13), true);
  assert.equal(state.observations.has('mail'), false);
  assert.equal(state.findings.length, 0);
  assert.equal(state.observations.get('doc').stale, false);
  assert.equal(state.operations[0], operation);
  assert.equal(state.revision, revision + 1);
  assert.deepEqual(state.takeCommands(), []);
  assert.equal(operation.status, 'failed');
  assert.match(operation.message, /no edit was attempted/);
  assert.equal(state.close(13), false);
});

test('Gmail presence removes only absent composers on that tab, including old stale copies', () => {
  const state = setup();
  const oldMail = state.observations.get('mail');
  state.observations.set('mail', { ...oldMail, stale: true, editable: false });
  state.observe({ ...oldMail, id: 'mail-reloaded', resourceId: 'mail-reloaded' });
  state.observe({ ...oldMail, id: 'mail-other-tab', resourceId: 'mail-other-tab', tabId: 14 });
  assert.equal(state.close(13, ['mail-reloaded']), true);
  assert.equal(state.observations.has('mail'), false);
  assert.equal(state.observations.get('mail-reloaded').stale, false);
  assert.equal(state.observations.get('mail-other-tab').stale, false);
  assert.equal(state.close(13, ['mail-reloaded']), false);
  assert.equal(state.close(13, []), true);
  assert.equal(state.observations.has('mail-reloaded'), false);
});

test('Docs presence still retains a stale snapshot and withholds its actions', () => {
  const state = setup();
  const oldText = state.observations.get('doc').text;
  assert.equal(state.close(12, []), true);
  assert.equal(state.observations.get('doc').text, oldText);
  assert.equal(state.observations.get('doc').stale, true);
  assert.equal(state.observations.get('doc').editable, false);
  assert.equal(state.findings.length, 1);
  assert.deepEqual(state.findings[0].actions.map(action => action.sourceId), ['mail']);
  assert.equal(state.close(12, []), false);
});

test('a late verified Gmail result completes its journal entry without resurrecting a closed composer', () => {
  const state = setup();
  const finding = state.findings[0];
  const mailAction = finding.actions.find(action => action.sourceId === 'mail');
  const returnedObservation = { ...state.observations.get('mail'), text: 'Atlas is on the fifth floor.' };
  const [{ operation }] = state.approve(finding.id, [mailAction.id]);
  state.takeCommands();
  state.close(13, []);
  assert.equal(operation.status, 'running');
  assert.equal(state.result(operation.id, { ok: true, message: 'Save verified before close.', observation: returnedObservation }).status, 'succeeded');
  assert.equal(state.observations.has('mail'), false);
  assert.equal(state.operations[0].message, 'Save verified before close.');
});
