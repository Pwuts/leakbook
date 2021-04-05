const installFrontendMods = Deno.run({
  cmd: ["npm", "ci"],
  cwd: './frontend/',
});

await installFrontendMods.status();

const genFrontend = Deno.run({
  cmd: ["npm", "run", "generate"],
  cwd: './frontend/',
});

await genFrontend.status();

const cacheMods = Deno.run({
  cmd: ["deno", "cache", "-r", "main.ts"],
});

await cacheMods.status();
