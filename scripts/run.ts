const run = Deno.run({
  cmd: [
    'deno', 'run',
    '--allow-env', '--allow-net', '--allow-read',
    '--v8-flags=--max-old-space-size=4096',
    'main.ts'
  ],
  env: {
    ENV_TYPE: 'production',
  },
});

await run.status();
