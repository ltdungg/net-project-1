import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.ts';
import { makeReport } from './support/report.mjs';

const root = path.resolve('test-results/selenium');
const latest = path.join(root, 'latest-run.json');
let args = process.argv.slice(2);
if (args.includes('--rerun-failed')) {
  const previous = JSON.parse(await readFile(latest, 'utf8'));
  const results = JSON.parse(await readFile(path.join(previous.directory, 'results.json'), 'utf8'));
  const ids = results.testResults.flatMap(file => file.assertionResults)
    .filter(test => test.status === 'failed').map(test => test.title.match(/[A-Z]+-\d+/)?.[0]).filter(Boolean);
  if (!ids.length) { console.log('Lượt trước không có test fail.'); process.exit(0); }
  args = [...args.filter(arg => arg !== '--rerun-failed'), '-t', ids.join('|')];
}
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const directory = process.env.SELENIUM_ARTIFACTS ? config.artifacts : path.join(root, stamp);
await mkdir(directory, { recursive: true });
const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'e2e/selenium/vitest.config.ts', ...args], {
  stdio: 'inherit', env: { ...process.env, SELENIUM_ARTIFACTS: directory },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', value => resolve(value ?? 1)); });
await makeReport(directory, code);
await writeFile(latest, JSON.stringify({ directory, exitCode: code, createdAt: new Date().toISOString() }, null, 2));
const relative = path.relative(root, directory).split(path.sep).join('/');
await writeFile(path.join(root, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Selenium report</title><a href="${relative}/report.html">Mở báo cáo Selenium gần nhất</a>`);
console.log(`\nBáo cáo HTML: ${directory}/report.html\nBảng test case: ${directory}/TEST_CASES.md`);
process.exitCode = code;
