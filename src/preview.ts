// Serves dist/ on localhost. Pass --open to also open it (in an Orca tab inside Orca, the default browser otherwise).
import path from 'node:path';

const DIST = path.resolve(import.meta.dir, '../dist');
const PORT = Number(process.env.PORT ?? 4173);

const notFound = () => new Response(Bun.file(path.join(DIST, '404.html')), { status: 404 });

/** A malformed escape or a NUL can't name a file, and either would otherwise throw. */
function distPath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.includes('\0') ? null : path.join(DIST, decoded);
  } catch {
    return null;
  }
}

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const target = distPath(pathname);
    if (target === null) return notFound();
    if (target !== DIST && !target.startsWith(DIST + path.sep)) return notFound();
    for (const candidate of [target, path.join(target, 'index.html')]) {
      const file = Bun.file(candidate);
      if ((await file.exists()) && file.size >= 0) return new Response(file);
    }
    return notFound();
  },
});

const url = `http://127.0.0.1:${PORT}/`;
console.log(`Serving dist/ at ${url}`);
if (process.argv.includes('--open')) {
  const command = process.env.ORCA_TERMINAL_HANDLE ? ['orca', 'tab', 'create', '--url', url] : ['open', url];
  Bun.spawn(command, { stdout: 'ignore', stderr: 'ignore' });
}
