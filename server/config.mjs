import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function loadConfig(root = process.cwd()) {
  const values = {};
  const file = await readFile(resolve(root, '.env'), 'utf8').catch(() => '');
  for (const line of file.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  const env = { ...values, ...process.env };
  return {
    port: Number(env.LIVINGTHREAD_PORT || 4317),
    model: {
      apiKey: env.AZURE_OPENAI_API_KEY || '',
      baseUrl: (env.AZURE_OPENAI_BASE_URL || '').replace(/\/+$/, ''),
      deployment: env.LIVINGTHREAD_MODEL || env.AZURE_OPENAI_MODEL_J_DEPLOYMENT || 'gpt-5.6-sol',
      reasoningEffort: env.LIVINGTHREAD_REASONING || 'low'
    },
    slack: {
      botToken: env.SLACK_BOT_TOKEN || '',
      appToken: env.SLACK_APP_TOKEN || '',
      channelIds: (env.SLACK_CHANNEL_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
    }
  };
}
