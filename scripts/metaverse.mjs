// `metaverse <command>` — one entry point for setting up and running the project.
// Invoked through the metaverse.cmd (Windows) / metaverse (macOS, Linux) wrappers in the repo root.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MIN_NODE = [22, 9];

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = c(32);
const yellow = c(33);
const red = c(31);
const bold = c(1);

function run(cmd, args) {
  // shell: true so `npm` resolves to npm.cmd on Windows
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true });
  return r.status ?? 1;
}

const npm = (...args) => run('npm', args);

function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
    console.error(red(`Node ${MIN_NODE.join('.')} or newer is required (you have ${process.versions.node}).`));
    console.error('Download the LTS version from https://nodejs.org and run `metaverse setup` again.');
    process.exit(1);
  }
  console.log(green('✓'), `Node ${process.versions.node}`);
}

function ensureEnv() {
  const file = `${ROOT}server/.env`;
  if (existsSync(file)) {
    console.log(green('✓'), 'server/.env already exists (left unchanged)');
    return;
  }
  const example = readFileSync(`${ROOT}server/.env.example`, 'utf8');
  writeFileSync(file, example.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`));
  console.log(green('✓'), 'Created server/.env with a random JWT secret');
}

const commands = {
  setup: {
    help: 'Check Node, download all packages, create server/.env',
    fn() {
      console.log(bold('\nSetting up METAVERSE…\n'));
      checkNode();
      console.log('\nDownloading packages (the first run also downloads Electron, ~100 MB)…\n');
      const code = npm('install');
      if (code !== 0) {
        console.error(red('\nnpm install failed — check your internet connection and try again.'));
        return code;
      }
      console.log();
      ensureEnv();
      console.log(green(bold('\nAll set!')), 'Start the app with:', bold('metaverse dev'), '\n');
      return 0;
    },
  },
  dev: {
    help: 'Run the web app → http://localhost:5180',
    fn: () => npm('run', 'dev'),
  },
  desktop: {
    help: 'Run the desktop app (plus the API and dev server)',
    fn: () => npm('run', 'dev:desktop'),
  },
  build: {
    help: 'Type-check and build the production client into client/dist',
    fn: () => npm('run', 'build'),
  },
  reset: {
    help: 'Delete all saved data (users, marks…) and go back to the demo data',
    async fn(args) {
      const dir = `${ROOT}server/data`;
      if (!existsSync(dir)) {
        console.log('Nothing to reset — no saved data yet.');
        return 0;
      }
      if (!args.includes('--yes')) {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(yellow('This deletes every user, password change and attendance mark you have saved. Continue? (y/N) '));
        rl.close();
        if (answer.trim().toLowerCase() !== 'y') {
          console.log('Cancelled.');
          return 0;
        }
      }
      rmSync(dir, { recursive: true, force: true });
      console.log(green('✓'), 'Data reset. Stop and restart the app if it is running.');
      return 0;
    },
  },
  help: {
    help: 'Show this list',
    fn() {
      console.log(`\n${bold('metaverse')} <command>\n`);
      for (const [name, { help }] of Object.entries(commands)) console.log(`  ${bold(name.padEnd(9))} ${help}`);
      console.log(`\nStop a running app with ${bold('Ctrl + C')}.\n`);
      return 0;
    },
  },
};

const [name = 'help', ...args] = process.argv.slice(2);
const cmd = commands[name];
if (!cmd) {
  console.error(red(`Unknown command: ${name}`));
  commands.help.fn();
  process.exit(1);
}
process.exit(await cmd.fn(args));
