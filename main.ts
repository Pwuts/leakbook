import {
  serve,
  serveTLS,
  listenAndServe,
  Server,
  ServerRequest
} from 'https://deno.land/std@0.92.0/http/server.ts';

const isProduction = Deno.env.get('ENV_TYPE') == 'production';
const hostname = isProduction ? 'facebooklekcheck.nl' : undefined;

let tls = false;
let server: Server | null = null;

if (isProduction)
try {
  console.log(`Starting HTTPS server on port 443`);
  server = serveTLS({
    port: 443,
    certFile: './certs/cert.pem',
    keyFile: './certs/privkey.pem',
  });
  tls = true;
}
catch (error) {
  console.log('No TLS possible, fallback to HTTP');
}

if (tls) {
  console.log('Redirecting all HTTP traffic to HTTPS');
  listenAndServe({ port: 80 }, req => {
    req.respond({
      status: 302,
      headers: new Headers({
        Location: `https://${hostname}${req.url}`,
      })
    })
  });
}
else {
  const port = Number(Deno.env.get('PORT')) || 8080;
  console.log(`Starting HTTP server on port ${port}`);
  server = serve({ port });
}

if (server == null) {
  throw new Error('Could not create server');
}

import { rateLimitRequest } from './modules/rate-limiter.ts';
import { makeResponder } from './util.ts';
import { proxyRequest } from "./modules/proxy.ts";
import serveStatic from "./modules/serve-static.ts";
import endpoints from './endpoints.ts';

const frontendServerUrl =
  !isProduction
  ? Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'
  : undefined;

if (frontendServerUrl) console.log(`Proxying to frontend at ${frontendServerUrl}`);


const decoder = new TextDecoder();

for await (const req of server) handleRequest(req);

async function handleRequest(req: ServerRequest): Promise<void>
{
  const respond = makeResponder(req, Date.now());

  try {
    const url = new URL(
      req.url,
      `http${tls ? 's' : ''}://${req.headers.get('host')}`
    );
    const endpoint = endpoints.find(rh =>
      (
        typeof rh.method == 'string' && rh.method == req.method ||
        rh.method.includes(req.method)
      ) && rh.urlMatcher(url)
    );

    if (
      endpoint &&
      'hostname' in req.conn.remoteAddr &&
      rateLimitRequest(req.conn.remoteAddr.hostname)
    ) {
      respond({ status: 429 });
      return;
    }

    if (!endpoint) {
      if (frontendServerUrl) {
        const url = `${frontendServerUrl}${req.url}`;

        try {
          await proxyRequest(req, url);
          return;
        }
        catch (error) {
          console.warn('frontend server not available');
        }
      }
      if (req.url && await serveStatic(`./frontend/dist${req.url}`, respond)) return;

      respond({
        status: 404,
      });
    }
    else {
      let body: object | undefined = undefined;

      if (req.headers.get('content-type')?.split(';')[0] == 'application/json') {
        const bodyText = decoder.decode(await Deno.readAll(req.body));
        body = JSON.parse(bodyText);
      }

      await endpoint.handler(respond, url, body, req);
    }
  }
  catch (error) {
    console.error('Unhandled error:', error);
    respond({
      status: 500,
      body: 'Unhandled server error :(',
    });
  }
}
