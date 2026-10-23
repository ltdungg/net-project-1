import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md = value => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');

export async function makeReport(directory, exitCode) {
  const cases = JSON.parse(await readFile(new URL('../data/test-cases.json', import.meta.url), 'utf8'));
  let result;
  try { result = JSON.parse(await readFile(path.join(directory, 'results.json'), 'utf8')); } catch { /* setup may fail before collecting */ }
  const assertions = result?.testResults?.flatMap(file => file.assertionResults) ?? [];
  const statuses = new Map(assertions.map(test => [test.title.match(/[A-Z]+-\d+/)?.[0], test]));
  const pass = assertions.filter(test => test.status === 'passed').length;
  const fail = assertions.filter(test => test.status === 'failed').length;
  const skip = assertions.filter(test => test.status === 'pending' || test.status === 'skipped').length;
  const summary = `${pass} PASS / ${fail} FAIL / ${skip} không chọn hoặc bỏ qua. Exit code: ${exitCode}.`;
  const stamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const rows = [];
  const markdown = [`# Bảng test case Selenium`, '', `Chạy lúc ${stamp} (Asia/Ho_Chi_Minh). ${summary}`, '',
    '| ID | Tên | Các bước | Kết quả mong đợi | Trạng thái chạy thử |', '| --- | --- | --- | --- | --- |'];
  for (const item of cases) {
    const test = statuses.get(item.id);
    const status = test?.status === 'passed' ? 'PASS' : test?.status === 'failed' ? 'FAIL' : test ? 'Không chọn' : 'BLOCKED / chưa chạy';
    const links = [];
    for (const artifact of ['failure.png', 'steps.log', 'browser.log']) {
      try { await access(path.join(directory, item.id, artifact)); links.push(`<a href="${item.id}/${artifact}">${artifact}</a>`); } catch { /* absent */ }
    }
    const failures = (test?.failureMessages ?? []).join('\n');
    rows.push(`<tr class="${status.toLowerCase()}"><td>${escape(item.id)}</td><td>${escape(item.name)}</td><td>${escape(item.steps)}</td><td>${escape(item.expected)}</td><td><b>${status}</b><br>${links.join('<br>')}${failures ? `<details><summary>Chi tiết lỗi</summary><pre>${escape(failures)}</pre></details>` : ''}</td></tr>`);
    markdown.push(`| ${item.id} | ${md(item.name)} | ${md(item.steps)} | ${md(item.expected)} | ${status} |`);
  }
  await writeFile(path.join(directory, 'TEST_CASES.md'), markdown.join('\n') + '\n');
  await writeFile(path.join(directory, 'report.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Selenium E2E</title>
    <style>body{font:15px system-ui;margin:30px;color:#172535;background:#f7f9fb}table{border-collapse:collapse;width:100%;background:white}td,th{padding:12px;text-align:left;vertical-align:top;border:1px solid #cdd5df}th{background:#16354f;color:white}.fail{background:#fff0f0}.pass b{color:#126b40}pre{white-space:pre-wrap;max-width:650px;font-size:12px}a{color:#1655a5}</style>
    <h1>Selenium E2E — NÉT Commerce</h1><p>${stamp} · Asia/Ho_Chi_Minh</p><p>${summary}</p>
    ${!assertions.length ? '<p>Không có kết quả thực thi test. Kiểm tra lỗi môi trường/setup trong console và results.json; không được xem là PASS.</p>' : ''}
    <p><a href="TEST_CASES.md">Bảng Markdown</a> · <a href="results.json">JSON</a> · <a href="junit.xml">JUnit</a></p>
    <table><thead><tr><th>ID</th><th>Tên</th><th>Các bước</th><th>Kết quả mong đợi</th><th>Thực tế</th></tr></thead><tbody>${rows.join('')}</tbody></table></html>`);
  return { pass, fail, skip };
}
