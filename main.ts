import { serve, ServerRequest } from 'https://deno.land/std@0.92.0/http/server.ts';

const port = Number(Deno.env.get('PORT')) || 8080;
const server = serve({ port });
console.log(`Starting server on port ${port}`);

import { rateLimitRequest } from './modules/rate-limiter.ts';
import { makeResponder } from './util.ts';
import { proxyRequest } from "./modules/proxy.ts";
import serveStatic from "./modules/serve-static.ts";
import endpoints from './endpoints.ts';

const frontendServerUrl =
  Deno.env.get('ENV_TYPE') != 'production'
  ? Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'
  : undefined;
if (frontendServerUrl) console.log(`Proxying to frontend at ${frontendServerUrl}`);

const decoder = new TextDecoder();

for await (const request of server) (async (req: ServerRequest) => {
  const respond = makeResponder(req, Date.now());

  try {
    const url = new URL(
      req.url,
      `http://${req.headers.get('host')}`
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
      if (req.url && serveStatic(`./frontend/dist${req.url}`, respond)) return;

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
})(request);
