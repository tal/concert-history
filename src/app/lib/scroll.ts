// Remembers each history entry's scroll position and decides where every navigation lands.
import { canonicalPath } from '../routes';

interface EntryState {
  scrollKey?: string;
  previousPath?: string;
}

/** Identifies a link across a remount: the DOM node is gone by the time Back rebuilds the page. */
interface FocusedLink {
  href: string;
  index: number;
}

type Arrival =
  | { kind: 'position'; y: number }
  | { kind: 'target'; focus: 'focus_main' | 'no_focus' };

const STORAGE_KEY = 'concert-history:scroll';
const MAX_ENTRIES = 200;
const RETRY_MS = 1500;
const NEAR_PX = 1;

const positions = new Map<string, number>();
const focusedLinks = new Map<string, FocusedLink>();
let currentKey: string | null = null;
let activePathname = '';
let lastY = 0;
let pending: Arrival | null = null;
let landing: Arrival | null = null;
let retryFrame: number | null = null;
let replaceEntry: History['replaceState'] = () => {};
let smoothJumpEnds = 0;

const newKey = () => Math.random().toString(36).slice(2, 10);
const entryState = () => history.state as EntryState | null;

function stamp(state: unknown, scrollKey: string, previousPath: string | undefined): EntryState {
  const own = state && typeof state === 'object' ? state : {};
  return { ...own, scrollKey, ...(previousPath ? { previousPath } : {}) };
}

function loadPositions() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as [string, number][];
    for (const [key, y] of stored) positions.set(key, y);
  } catch {
    // Unavailable or unreadable storage only costs the restored position.
  }
}

function persistPositions() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions]));
  } catch {
    // Same as above.
  }
}

const linksTo = (href: string) => [...document.links].filter((link) => link.getAttribute('href') === href);

function rememberFocus(key: string) {
  const active = document.activeElement;
  const href = active instanceof HTMLAnchorElement ? active.getAttribute('href') : null;
  if (href === null) focusedLinks.delete(key);
  else focusedLinks.set(key, { href, index: linksTo(href).indexOf(active as HTMLAnchorElement) });
}

function restoreFocus(key: string) {
  const link = focusedLinks.get(key);
  if (link) linksTo(link.href)[link.index]?.focus({ preventScroll: true });
}

function remember() {
  if (currentKey === null) return;
  positions.delete(currentKey);
  positions.set(currentKey, lastY);
  rememberFocus(currentKey);
  if (positions.size > MAX_ENTRIES) {
    const oldest = positions.keys().next().value!;
    positions.delete(oldest);
    focusedLinks.delete(oldest);
  }
  persistPositions();
}

function cancelRetry() {
  if (retryFrame !== null) cancelAnimationFrame(retryFrame);
  retryFrame = null;
}

/** Once the reader moves the page themselves, nothing should pull it back. */
function onReaderInput() {
  cancelRetry();
  landing = null;
}

/** Home's animated year jump calls this. Its animation can overwrite an instant scroll made while it runs. */
export function smoothJumpStarted() {
  smoothJumpEnds = performance.now() + RETRY_MS;
}

/** The page may still be growing, so a clamped scroll is retried briefly. A year jump still animating is held off the same way. */
function restore(y: number) {
  const deadline = performance.now() + RETRY_MS;
  const attempt = () => {
    retryFrame = null;
    window.scrollTo(0, y);
    lastY = window.scrollY;
    const now = performance.now();
    if ((Math.abs(lastY - y) > NEAR_PX || now < smoothJumpEnds) && now < deadline) retryFrame = requestAnimationFrame(attempt);
  };
  attempt();
}

function arrive(arrival: Arrival) {
  cancelRetry();
  if (arrival.kind === 'position') {
    restore(arrival.y);
    if (currentKey !== null) restoreFocus(currentKey);
    return;
  }
  if (arrival.focus === 'focus_main') document.querySelector('main')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  lastY = window.scrollY;
  if (performance.now() < smoothJumpEnds) restore(lastY);
}

/** The same page renders nothing new, so it lands now; otherwise it waits for pageRendered. */
function arriveAfterMove(arrival: Arrival, outgoingPathname: string) {
  activePathname = location.pathname;
  if (canonicalPath(location.pathname) === canonicalPath(outgoingPathname)) arrive(arrival);
  else pending = arrival;
}

function arrivalFor(key: string): Arrival {
  const y = positions.get(key);
  return y === undefined ? { kind: 'target', focus: 'no_focus' } : { kind: 'position', y };
}

/** A native jump to a #fragment makes a new entry that no code here got to stamp. */
function adoptNativeEntry() {
  if (entryState()?.scrollKey) return;
  remember();
  currentKey = newKey();
  replaceEntry(stamp(history.state, currentKey, canonicalPath(activePathname)), '', location.href);
  activePathname = location.pathname;
}

function onPopState() {
  const key = entryState()?.scrollKey;
  if (!key) {
    adoptNativeEntry();
    return;
  }
  if (key === currentKey) return;
  cancelRetry();
  remember();
  currentKey = key;
  arriveAfterMove(arrivalFor(key), activePathname);
}

function patchHistory() {
  const pushEntry = history.pushState.bind(history);
  replaceEntry = history.replaceState.bind(history);

  history.pushState = (state: unknown, unused: string, url?: string | URL | null) => {
    cancelRetry();
    remember();
    const outgoing = location.pathname;
    const sameUrl = url === undefined || url === null || new URL(url, location.href).href === location.href;
    if (sameUrl) {
      // Like a real link to the current URL: no new entry for Back to stumble over.
      replaceEntry(stamp(state, currentKey!, entryState()?.previousPath), unused, url);
    } else {
      currentKey = newKey();
      pushEntry(stamp(state, currentKey, canonicalPath(outgoing)), unused, url);
    }
    arriveAfterMove({ kind: 'target', focus: 'focus_main' }, outgoing);
  };

  history.replaceState = (state: unknown, unused: string, url?: string | URL | null) => {
    const outgoing = location.pathname;
    replaceEntry(stamp(state, currentKey!, entryState()?.previousPath), unused, url);
    if (location.pathname !== outgoing) arriveAfterMove({ kind: 'target', focus: 'no_focus' }, outgoing);
  };
}

/** Called once from the client entry, before hydration, so a reload is back in place as early as possible. */
export function startScrollMemory() {
  if (currentKey !== null) return;
  history.scrollRestoration = 'manual';
  loadPositions();
  lastY = window.scrollY;
  activePathname = location.pathname;

  patchHistory();
  const existing = entryState()?.scrollKey;
  currentKey = existing ?? newKey();
  if (!existing) replaceEntry(stamp(history.state, currentKey, undefined), '', location.href);

  // These run for the life of the page, and are registered before wouter's so outgoing state is read first.
  addEventListener('popstate', onPopState);
  addEventListener('hashchange', adoptNativeEntry);
  // A pending arrival means lastY still describes the page being left, not the entry now current.
  addEventListener('pagehide', () => {
    if (!pending) remember();
  });
  addEventListener('scroll', () => {
    if (retryFrame === null && !pending) lastY = window.scrollY;
  }, { passive: true });
  for (const type of ['wheel', 'touchstart', 'keydown']) addEventListener(type, onReaderInput, { passive: true });

  const y = positions.get(currentKey);
  if (y !== undefined) landing = { kind: 'position', y };
  else if (location.hash) landing = { kind: 'target', focus: 'no_focus' };
  if (landing) arrive(landing);
}

/** Called in a layout effect once a new page is in the DOM. The first call re-applies the landing, now that the real layout exists. */
export function pageRendered() {
  const arrival = pending ?? landing;
  pending = null;
  landing = null;
  if (arrival) arrive(arrival);
}

/** Canonical pathname of the entry this one was navigated from in-app, if there is one. */
export const previousPathname = (): string | null => entryState()?.previousPath ?? null;
