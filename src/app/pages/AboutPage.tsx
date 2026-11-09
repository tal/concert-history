/** @jsxImportSource preact */
// How the archive was reconstructed and how to read its evidence.
import { STATUS_LABELS } from '../../model';
import type { Status } from '../../types';
import { useSite, useUrls } from '../context';

export function AboutPage() {
  const site = useSite();
  const urls = useUrls();
  const tally = (Object.keys(STATUS_LABELS) as Status[]).flatMap((status) => {
    const count = site.shows.filter((s) => s.concert.status === status).length;
    return count ? [{ status, count }] : [];
  });
  return (
    <>
      <header class="head">
        <h1 class="neon neon--lg">About this archive</h1>
      </header>
      <div class="prose">
        <p>{`This is a reconstruction from receipts, check-ins, calendars and photos, researched through ${site.data.researched_on}. It doesn’t claim complete lifetime coverage.`}</p>
        <h2>How to read it</h2>
        <p>
          <strong>Check-in confirmed</strong> means Swarm names the artist, or a venue and date visit matches a named event in another source. <strong>Photo corroborated</strong> means inspected concert imagery matches the date and venue. <strong>Attendee confirmed</strong> means Tal remembers attending, and its notes record any evidence that conflicts. Tickets and calendar events alone establish a booking or a plan, not attendance, so those shows are drawn hollow on the timeline.
        </p>
        <p>Supporting acts are billed performers. A listing doesn’t establish that every set was seen. Festivals and multi-act showcases count as one event.</p>
        <ul class="tally">
          {tally.map(({ status, count }) => (
            <li key={status}>
              <strong>{status}</strong> <span>{count}</span>
            </li>
          ))}
        </ul>
        <h2>What was reviewed</h2>
        <p>Gmail ticket receipts, transfers, sales, refunds and cancellations; Swarm’s music-venue history; personal, family and shared calendars; named concert albums and selected date and location matches in Apple Photos, Google Photos and iCloud. Some dates remain unmatched, and this wasn’t a review of every asset in those libraries. Generic music-venue visits and unknown festival sets remain unresolved.</p>
        <h2>Pitfalls kept on the record</h2>
        <p>Sold Strokes tickets; the Yeah Yeah Yeahs July 28 / July 30 swap; cancelled DIIV and Alex Winston shows; the DIIV wrong-day visit; Jungle’s October 2014 date and venue conflict; Flogging Molly’s 2012 receipt versus the actual check-in; and Sleigh Bells’ 2022 postponement.</p>
        <p>
          <a href={urls.asset('concert-history.md')}>Plain Markdown list</a> · <a href={urls.asset('concerts.json')}>JSON export</a>
        </p>
      </div>
    </>
  );
}
