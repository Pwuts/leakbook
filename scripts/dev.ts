const devFrontend = Deno.run({
  cmd: ["npm", "run", "dev"],
  cwd: './frontend/',
});

const devServer = Deno.run({
  cmd: [
    'deno', 'run',
    '--allow-env', '--allow-net', '--allow-read',
    '--v8-flags=--max-old-space-size=4096',
    '--unstable', '--watch',
    'main.ts'
  ],
  env: {
    ENV_TYPE: 'dev',
  },
});

await Promise.all([devFrontend.status(), devServer.status()]);
