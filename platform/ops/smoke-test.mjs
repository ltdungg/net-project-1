const baseUrl = (process.env.BASE_URL ?? 'http://localhost:8787').replace(
  /\/$/,
  '',
);

const checks = [
  { name: 'Storefront', path: '/', contentType: 'text/html' },
  {
    name: 'Integrated health',
    path: '/api/health',
    contentType: 'application/json',
  },
  {
    name: 'Java health through BFF',
    path: '/api/commerce/health',
    contentType: 'application/json',
  },
  {
    name: 'Java catalog through BFF',
    path: '/api/commerce/products',
    contentType: 'application/json',
  },
];

let failed = false;
for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: { accept: check.contentType },
      redirect: 'manual',
    });
    const healthy =
      response.ok &&
      (response.headers.get('content-type') ?? '').includes(check.contentType);
    console.log(
      `${healthy ? 'PASS' : 'FAIL'} ${check.name}: ${response.status}`,
    );
    if (!healthy) failed = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${check.name}: ${message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
