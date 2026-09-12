import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { AgentError, analyzeObservations } from '../server/agent.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Verify behavior, rather than exact model wording. Inputs and actions remain synthetic. */
export function evaluateFindings(scenario, findings) {
  const failures = [];
  const actions = findings.flatMap((finding) => finding.actions);
  const replacements = actions.filter((action) => action.kind === 'replace_text');
  const messages = actions.filter((action) => action.kind === 'slack_message');
  if (scenario.checks.kind === 'none') {
    if (findings.length !== 0) failures.push('Expected no finding for a valid difference or unrelated event.');
  } else {
    if (!findings.some((finding) => finding.kind === scenario.checks.kind)) {
      failures.push(`Expected at least one ${scenario.checks.kind} finding.`);
    }
    if (findings.some((finding) => finding.kind !== scenario.checks.kind)) {
      failures.push('Unexpected finding kind.');
    }
  }
  const expectedSources = [...scenario.checks.requiredReplacementSources].sort();
  const actualSources = replacements.map((action) => action.sourceId).sort();
  if (JSON.stringify(actualSources) !== JSON.stringify(expectedSources)) {
    failures.push('The proposed replacement source set does not match the affected resources.');
  }
  if (scenario.checks.replacementPattern) {
    const expected = new RegExp(scenario.checks.replacementPattern, 'i');
    for (const action of replacements) {
      const source = scenario.observations.find((item) => item.id === action.sourceId);
      const changed = source.text.replace(action.before, action.after);
      if (!expected.test(changed)) failures.push('A proposed replacement does not establish the expected venue.');
      if (/third floor/i.test(changed)) failures.push('A proposed replacement leaves the known outdated floor in the target.');
      const oldTimes = source.text.match(/\b(?:15:00|15:30)\b/g) || [];
      const newTimes = changed.match(/\b(?:15:00|15:30)\b/g) || [];
      if (JSON.stringify(oldTimes) !== JSON.stringify(newTimes)) failures.push('A venue edit changes the unrelated time.');
    }
  }
  if (scenario.checks.forbidSlackMessages && messages.length) failures.push('The model proposed a redundant Slack message.');
  return { pass: failures.length === 0, failures, findingCount: findings.length,
    replacementCount: replacements.length, slackMessageCount: messages.length };
}

function redact(value, config) {
  let text = String(value);
  for (const secret of [config.apiKey, config.baseUrl]) {
    if (secret) text = text.split(secret).join('[redacted]');
  }
  return text.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 500);
}

export async function runEvaluation({ caseIds = [], repeat = 1 } = {}) {
  const fixture = JSON.parse(await readFile(resolve(projectRoot, 'tests/fixtures/semantic-cases.json'), 'utf8'));
  const scenarios = fixture.cases.filter((scenario) => caseIds.length === 0 || caseIds.includes(scenario.id));
  if (scenarios.length === 0 || caseIds.some((id) => !scenarios.some((scenario) => scenario.id === id))) {
    throw new Error('Unknown evaluation case.');
  }
  if (!Number.isInteger(repeat) || repeat < 1 || scenarios.length * repeat > 10) {
    throw new Error('An evaluation invocation is limited to ten model requests.');
  }
  const { model } = await loadConfig(projectRoot);
  const reportPath = resolve(projectRoot, 'docs/SEMANTIC_EVALUATION.json');
  let previous;
  try { previous = JSON.parse(await readFile(reportPath, 'utf8')); } catch { previous = { runs: [] }; }
  const run = { startedAt: new Date().toISOString(), model: model.deployment,
    reasoningEffort: model.reasoningEffort, requestCount: 0, passed: 0, cases: [] };
  for (let attempt = 1; attempt <= repeat; attempt += 1) {
    for (const scenario of scenarios) {
      console.log(`${scenario.id}: expected ${scenario.expected}`);
      const started = performance.now();
      run.requestCount += 1;
      let record;
      try {
        const result = await analyzeObservations(scenario.observations, {
          config: model, clarifications: scenario.clarifications, timeoutMs: 45_000,
        });
        const checks = evaluateFindings(scenario, result.findings);
        record = { id: scenario.id, attempt, expected: scenario.expected, ...checks,
          latencyMs: result.latencyMs,
          summaries: result.findings.map((finding) => ({ kind: finding.kind, summary: redact(finding.summary, model),
            actionCount: finding.actions.length })),
          ...(result.usage ? { usage: result.usage } : {}) };
        console.log(`${scenario.id}: ${checks.pass ? 'PASS' : 'FAIL'}; findings=${checks.findingCount}; replacements=${checks.replacementCount}; slackMessages=${checks.slackMessageCount}; latencyMs=${result.latencyMs}`);
        for (const finding of record.summaries) console.log(`  ${finding.kind}: ${finding.summary}`);
        for (const failure of checks.failures) console.log(`  ${failure}`);
      } catch (error) {
        record = { id: scenario.id, attempt, expected: scenario.expected, pass: false,
          errorCode: error instanceof AgentError ? error.code : 'EVALUATION_ERROR',
          error: error instanceof AgentError ? redact(error.message, model) : 'The evaluation could not complete.',
          latencyMs: Math.round(performance.now() - started) };
        console.log(`${scenario.id}: FAIL; ${record.errorCode}; latencyMs=${record.latencyMs}`);
      }
      if (record.pass) run.passed += 1;
      run.cases.push(record);
      run.completedAt = new Date().toISOString();
      const report = {
        description: 'Real Azure model calls using synthetic observations only. No app writes or communications executed.',
        limitations: [
          'This small evaluation measures specified semantic scenarios, not general reliability.',
          'It does not validate browser or Slack integration, observation freshness, or saved edits.',
          'Reported latency covers the model request and engine validation; it excludes app observation and UI delays.',
        ],
        runs: [...(Array.isArray(previous.runs) ? previous.runs : []), run],
      };
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
  }
  return run;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const caseIds = args.filter((arg) => arg.startsWith('--case=')).map((arg) => arg.slice(7));
  const repeatArg = args.find((arg) => arg.startsWith('--repeat='));
  const unknown = args.some((arg) => !arg.startsWith('--case=') && !arg.startsWith('--repeat='));
  if (unknown) {
    console.error('Usage: node scripts/evaluate.mjs [--case=case-id] [--repeat=1]');
    process.exitCode = 1;
  } else {
    runEvaluation({ caseIds, repeat: repeatArg ? Number(repeatArg.slice(9)) : 1 }).then((run) => {
      console.log(`Evaluation: ${run.passed}/${run.requestCount} scenarios passed.`);
      process.exitCode = run.passed === run.requestCount ? 0 : 1;
    }).catch(() => {
      console.error('Evaluation setup failed. Check configuration and case arguments.');
      process.exitCode = 1;
    });
  }
}
