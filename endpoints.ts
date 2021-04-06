import { IResponse } from "./util.ts";
import { ServerRequest } from "https://deno.land/std@0.92.0/http/server.ts";
import { nameMatchesPhoneNumber, numberIsLeaked } from "./datasets/index.ts";

const endpoints: Array<{
  urlMatcher: (url: URL) => boolean,
  handler(respond: (res: IResponse) => Promise<void>, url: URL, request: ServerRequest): Promise<void>,
}> = [
  {
    urlMatcher: url => url.pathname == '/check',
    handler: async (respond, url) => {
      if (!url.searchParams.has('phoneNumber') || !url.searchParams.get('phoneNumber')) {
        await respond({
          status: 400,
          body: 'missing parameter \'phoneNumber\'',
        });
        return;
      }
      const name = url.searchParams.get('name')?.trim();
      let phoneNumber = (url.searchParams.get('phoneNumber') as string).replace(/\s/g, '');

      if (!/^((\+|00)?31|0)\d{9}$/.test(phoneNumber)) {
        await respond({
          status: 400,
          body: 'invalid phone number',
        });
        return;
      }

      if (phoneNumber.substr(0, 4) == '+316') {
        phoneNumber = phoneNumber.slice(1);
      }
      else if (phoneNumber.substr(0,2) == '06') {
        phoneNumber = '31' + phoneNumber.slice(1);
      }

      const numberIsPwned = numberIsLeaked(phoneNumber);
      const nameMatches = name && numberIsPwned ? nameMatchesPhoneNumber(phoneNumber, name) : null;

      await respond({
        body: JSON.stringify({
          numberIsPwned,
          nameMatches
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
      });
    }
  },
];
export default endpoints;
