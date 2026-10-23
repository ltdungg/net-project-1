import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { TestData, withDatabase } from './support/data.ts';

const directory = process.argv[2];
if (!directory) throw new Error('Truyền thư mục kết quả của lượt chạy đã dừng.');
for (const entry of await readdir(directory, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  let log;
  try { log = await readFile(path.join(directory, entry.name, 'steps.log'), 'utf8'); } catch { continue; }
  // Exact UUID namespaces recorded by this suite only. Never truncate shared tables.
  const ids = [...log.matchAll(/data namespace (sel[0-9a-f]{32})/g)].map(match => match[1]);
  for (const id of ids) {
    const fixture = new TestData(id);
    const emails = await withDatabase(async db => (await db.query(
      "select email from users where email like $1 union select email from customer_orders where email like $1", [`${id}-%@example.test`])).rows);
    fixture.emails.push(...emails.map(row => row.email));
    await fixture.cleanup();
    await rm(path.resolve('test-results/selenium/.profiles', id), { recursive: true, force: true });
    console.log(`Đã dọn namespace ${id}`);
  }
}
