/** @jsxImportSource preact */
// The image viewer: one dialog for the whole site, opened by any gallery link.
import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { Out } from './Out';

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
  source?: string;
  sourceLabel?: string;
}

type OpenGallery = (items: LightboxItem[], index: number) => void;

interface Gallery {
  items: LightboxItem[];
  index: number;
}

const LightboxContext = createContext<OpenGallery | null>(null);

/** Needs to sit inside the wouter Router, because the dialog closes when the route changes. */
export function LightboxProvider({ children }: { children: ComponentChildren }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [location] = useLocation();

  const open = useCallback<OpenGallery>((items, index) => {
    setGallery({ items, index });
    dialog.current?.showModal();
  }, []);
  const close = () => dialog.current?.close();
  const step = (delta: number) =>
    setGallery((current) => current && { ...current, index: (current.index + delta + current.items.length) % current.items.length });

  useEffect(() => {
    dialog.current?.close();
  }, [location]);

  const item = gallery?.items[gallery.index];
  const total = gallery?.items.length ?? 0;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  };
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === dialog.current) close();
  };

  return (
    <LightboxContext.Provider value={open}>
      {children}
      <dialog id="lightbox" ref={dialog} aria-label="Image viewer" onClick={onBackdrop} onKeyDown={onKeyDown}>
        <button class="lb__close" aria-label="Close" onClick={close}>×</button>
        <img id="lb-img" src={item?.src} alt={item?.alt ?? ''} />
        <p id="lb-cap">
          {item ? (item.source ? `${item.caption} · ` : item.caption) : null}
          {item?.source ? <Out href={item.source}>{item.sourceLabel ?? 'Original'}</Out> : null}
        </p>
        <div class="lb__nav">
          <button id="lb-prev" aria-label="Previous image" hidden={total === 1} onClick={() => step(-1)}>←</button>
          <span id="lb-pos" aria-live="polite">{total > 1 ? `${gallery!.index + 1} / ${total}` : null}</span>
          <button id="lb-next" aria-label="Next image" hidden={total === 1} onClick={() => step(1)}>→</button>
        </div>
      </dialog>
    </LightboxContext.Provider>
  );
}

export interface GalleryLinkProps {
  items: LightboxItem[];
  index: number;
  class?: string;
  children: ComponentChildren;
}

/** A plain link to the image until it's left-clicked, so opening it in a new tab still works. */
export function GalleryLink({ items, index, class: className, children }: GalleryLinkProps) {
  const open = useContext(LightboxContext);
  if (!open) throw new Error('Needs a LightboxProvider above it');
  const onClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    open(items, index);
  };
  return (
    <a class={className} href={items[index]!.src} onClick={onClick}>
      {children}
    </a>
  );
}
