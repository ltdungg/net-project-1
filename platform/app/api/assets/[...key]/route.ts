import { env } from 'cloudflare:workers';

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const object = await env.FILES.get(key.join('/'));
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  if (request.headers.get('if-none-match') === object.httpEtag)
    return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
