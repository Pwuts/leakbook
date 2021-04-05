import { IResponse } from "../util.ts";
import mime from "https://ga.jspm.io/npm:mime@2.0.3/types/standard.json.js";

export default function serveStatic(path: string | URL, respond: (res: IResponse) => void): boolean
{
  let fileContent: Uint8Array;

  try {
    let fileEntry = Deno.statSync(path);

    if (fileEntry.isDirectory) {
      path = getIndexForDirectory(path);
    }

    fileContent = Deno.readFileSync(path);
  }
  catch (error) {
    return false;
  }

  let fileExt = (path instanceof URL ? path.pathname : path).split('.').pop() as string;

  const mimeType =
    Object.entries(mime as {[mimeType: string]: string[]})
    .find(([_mimeType, exts]) => exts.includes(fileExt))?.[0];

  respond({
    status: 200,
    body: fileContent,
    headers: new Headers({
      'Content-Type': mimeType ?? 'application/octet-stream',
    }),
  });

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
