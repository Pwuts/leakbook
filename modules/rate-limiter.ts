let rates: { [client: string]: number } = {};

const limit = 100;

export function rateLimitRequest(client: string): boolean
{

    if (!(client in rates)) {
        rates[client] = 1;
        return false;
    }

    return ++rates[client] > limit;
}

// reset rates every 10 minutes
setInterval(() => {
    rates = {};
}, 10*60*1e3);
