// Serves dist/ on localhost. Pass --open to also open it (in an Orca tab inside Orca, the default browser otherwise).
import path from 'node:path';

const DIST = path.resolve(import.meta.dir, '../dist');
const PORT = Number(process.env.PORT ?? 4173);

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const target = path.join(DIST, decodeURIComponent(pathname));
    if (target !== DIST && !target.startsWith(DIST + path.sep)) return new Response('Not found', { status: 404 });
    for (const candidate of [target, path.join(target, 'index.html')]) {
      const file = Bun.file(candidate);
      if ((await file.exists()) && file.size >= 0) return new Response(file);
    }
    return new Response('Not found', { status: 404 });
  },
});

const url = `http://127.0.0.1:${PORT}/`;
console.log(`Serving dist/ at ${url}`);
if (process.argv.includes('--open')) {
  const command = process.env.ORCA_TERMINAL_HANDLE ? ['orca', 'tab', 'create', '--url', url] : ['open', url];
  Bun.spawn(command, { stdout: 'ignore', stderr: 'ignore' });
}
