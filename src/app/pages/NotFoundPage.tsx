/** @jsxImportSource preact */
// Any path the archive has no page for.
import { Link } from 'wouter-preact';

export function NotFoundPage() {
  return (
    <>
      <header class="head">
        <h1 class="neon neon--lg">Page not found</h1>
      </header>
      <div class="prose">
        <p>That page isn’t in the archive.</p>
        <p>
          <Link href="/">Back to the timeline</Link>
        </p>
      </div>
    </>
  );
}
