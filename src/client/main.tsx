/** @jsxImportSource preact */
// The client entry: fetches the site data and takes over the prerendered page.
import { hydrate } from 'preact';
import { App } from '../app/App';
import { startScrollMemory } from '../app/lib/scroll';
import { tidyPathname } from '../app/routes';
import { fromPayload, type SitePayload } from '../payload';

/** With no app to run them, the search box and chips would look alive and do nothing, so a note takes their place. */
function showStaticFallback() {
  for (const bar of document.querySelectorAll('.filters')) {
    const note = document.createElement('p');
    note.className = 'credit';
    note.textContent = 'Search and filters didn’t load. Reload the page to try again.';
    bar.replaceChildren(note);
  }
}

async function start() {
  const script = document.querySelector<HTMLScriptElement>('script[data-payload]');
  const root = document.getElementById('app');
  if (!script?.dataset.payload || !script.dataset.base || !root) throw new Error('The page has no app root or payload script');

  // Some servers answer a doubled slash or wrong case with a page, or with the 404 page. Either way the real page is one load away.
  const tidy = tidyPathname(location.pathname, script.dataset.base);
  if (tidy !== location.pathname) {
    location.replace(tidy + location.search + location.hash);
    return;
  }

  startScrollMemory();

  // Nothing renders a popstate until the app is running, so Back or Forward to another page needs a real load.
  const startPath = location.pathname;
  const followHistory = () => {
    if (location.pathname !== startPath) location.reload();
  };
  addEventListener('popstate', followHistory);

  // Hydration keeps these same elements, so a press from before it can be replayed once they have handlers.
  const pressed: HTMLButtonElement[] = [];
  const recordPress = (event: MouseEvent) => {
    const button = (event.target as Element).closest('button');
    if (button) pressed.push(button);
  };
  root.addEventListener('click', recordPress);

  const response = await fetch(script.dataset.payload);
  if (!response.ok) throw new Error(`Payload request failed with ${response.status}`);
  const site = fromPayload((await response.json()) as SitePayload);
  if (location.pathname !== startPath) return; // followHistory's reload is already under way.

  removeEventListener('popstate', followHistory);
  root.removeEventListener('click', recordPress);
  hydrate(<App site={site} base={script.dataset.base} />, root);
  for (const button of pressed) button.click();
}

start().catch((error: unknown) => {
  console.error('Staying on the static page:', error);
  showStaticFallback();
});
