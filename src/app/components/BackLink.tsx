/** @jsxImportSource preact */
// A crumb back to a list: returns to the exact spot you came from when that list is the previous page.
import type { ComponentChildren } from 'preact';
import { Link, useRouter } from 'wouter-preact';
import { previousPathname } from '../lib/scroll';
import { canonicalPath } from '../routes';

export interface BackLinkProps {
  href: string;
  class?: string;
  /** Runs when the crumb will open `href` as a new page instead of going back to it. */
  onOpen?: () => void;
  children: ComponentChildren;
}

export function BackLink({ href, class: className, onOpen, children }: BackLinkProps) {
  const { base } = useRouter();
  const goBack = (event: MouseEvent) => {
    if (previousPathname() !== canonicalPath(base + href)) {
      onOpen?.();
      return;
    }
    event.preventDefault();
    history.back();
  };
  return (
    <Link href={href} class={className} onClick={goBack}>
      {children}
    </Link>
  );
}
