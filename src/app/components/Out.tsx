/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/** A link that leaves the site. */
export function Out({ href, cls, children }: { href: string; cls?: string; children: ComponentChildren }) {
  return (
    <a class={cls || undefined} href={href} rel="noopener nofollow" target="_blank">
      {children}
    </a>
  );
}
