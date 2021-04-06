import { ServerRequest } from "https://deno.land/std@0.92.0/http/server.ts";
import { IResponse } from "../util.ts";
import { serveFile } from "https://deno.land/std@0.92.0/http/file_server.ts"

export default async function serveStatic(
  path: string | URL,
  req: ServerRequest,
  respond: (res: IResponse) => Promise<void>
): Promise<boolean>
{
  try {
    let fileEntry = Deno.statSync(path);

    if (fileEntry.isDirectory) {
      path = getIndexForDirectory(path);
    }
  }
  catch (error) {
    return false;
  }

  await req.respond(await serveFile(req, path instanceof URL ? path.pathname : path));

  return true;
}

function getIndexForDirectory(dirPath: string | URL): string
{
  for (const dirEntry of Deno.readDirSync(dirPath)) {
    if (dirEntry.isFile && /^index\.x?html?$/.test(dirEntry.name)) {
      return (dirPath instanceof URL ? dirPath.pathname : dirPath) + dirEntry.name;
    }
  }
  throw new Error('directory has no index file');
}
