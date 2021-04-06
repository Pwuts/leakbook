import { ServerRequest } from "https://deno.land/std@0.92.0/http/server.ts";
import { writeResponse } from "https://deno.land/std@0.92.0/http/_io.ts";
import { copy } from "https://deno.land/std@0.92.0/bytes/mod.ts";

export async function proxyRequest(req: ServerRequest, targetUrl: string): Promise<void>
{
  const proxiedRes = await fetch(targetUrl, {
    method: req.method,
    headers: req.headers,
  });

  const contentType = proxiedRes.headers.get('content-type');

  if (contentType && contentType.split(';')[0] == 'text/event-stream') {
    return pipeEventStream(proxiedRes, req);
  }

  await req.respond({
    body: await proxiedRes.text(),
    status: proxiedRes.status,
    headers: proxiedRes.headers,
  });
  console.log(`${req.method} [frontend]${req.url} -> ${proxiedRes.status}`);
}

export async function pipeEventStream(src: Response, dst: ServerRequest)
{
  if (
    !src.body ||
    src.headers.get('content-type')?.split(';')[0] !== 'text/event-stream'
  ) {
    throw new Error('source response is not event stream');
  }

  console.log(`GET [frontend]${dst.url} -> piping event source`);

  await writeResponse(dst.conn, {
    status: src.status,
    headers: new Headers({
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream'
    }),
    body: readableStreamToReader(src.body),
  });
}

export function readableStreamToReader(stream: ReadableStream<Uint8Array>): Deno.Reader
{
  const reader = stream.getReader();

  return {
    async read(target: Uint8Array) {
      return reader.read()
      .then(r => {
        if (r.done) {
          return null;
        }
        return copy(r.value, target);
      })
    }
  }
}
