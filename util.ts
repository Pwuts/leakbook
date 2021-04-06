import { Response, ServerRequest } from 'https://deno.land/std@0.92.0/http/server.ts';

export function formatNumber(n: number): string
{
  if (n < 1e3) return n.toString();
  if (n < 1e4) return (n/1e3).toFixed(1) + 'k';
  if (n < 1e6) return (n/1e3).toFixed(0) + 'k';
  if (n < 1e7) return (n/1e6).toFixed(1) + 'M';
  else return (n/1e6).toFixed(0) + 'M';
}

export function makeResponder(req: ServerRequest, tStart: number)
{
  return async function respond(res: IResponse) {
    if (!res.headers) res.headers = new Headers();
    res.headers.set('Access-Control-Allow-Origin', '*');

    let body: string | Uint8Array | undefined;
    if (res.body) {
      if (typeof res.body == 'object' && res.body.constructor.name == 'Object') {
        body = JSON.stringify(res.body);
        res.headers.set('Content-Type', 'application/json');
      }
      else if (typeof res.body == 'string' || res.body instanceof Uint8Array) {
        body = res.body;
      }
    }

    await req.respond({
      ...res,
      body,
    });

    const length = body ? formatNumber(body.length) : '0';
    console.log(`${req.method} ${req.url} -> ${res.status ?? 200}, ${length}B, in ${Date.now() - tStart} ms`);
  }
}

export interface IResponse extends Omit<Response, 'body'> {
  body?: string | object
}

export function generateId(): string
{
  return Math.floor(Math.random()*1e10).toString().padStart(10, '0');
}
