const installFrontendMods = Deno.run({
  cmd: ['yarn', 'install', '--force'],
  cwd: './frontend/',
});

await installFrontendMods.status();

const genFrontend = Deno.run({
  cmd: ['yarn', 'run', 'generate'],
  cwd: './frontend/',
});

await genFrontend.status();

const cacheMods = Deno.run({
  cmd: ['deno', 'cache', '-r', 'main.ts'],
});

await cacheMods.status();
