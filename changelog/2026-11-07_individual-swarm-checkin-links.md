# Link Swarm evidence to individual check-ins

- Replaced 143 general Swarm history links in `data/concerts.yml` with individual check-in URLs.
- Filled 146 missing `checkin_id` values, including three entries that already had individual URLs. All 147 Swarm sources now have individual links and IDs; the previously recorded 2017 Gogol Bordello boat-show source is preserved.
- Verified the URL structure against a live check-in: `https://www.swarmapp.com/user/9203/checkin/<checkin_id>`. Legacy `/koalemos/checkin/<checkin_id>` links on Swarm redirect to this structure; the old `foursquare.com` host can return 404.
- Recovered IDs from authenticated Swarm history, matching local dates and venues and reviewing event names or shouts for duplicate visits. Morning Parade and The Hundred in the Hands on 2012-06-20 have separate links despite sharing a venue. The Sleigh Bells concert dated 2013-10-05 links to its after-midnight 2013-10-06 check-in.
- Each updated source records its original venue, local timestamp, recovery date, and event name when available in `id_note`. Local raw candidates and the match inventory are retained in the ignored `research/` directory.
- Concert dates, artist attributions, attendance statuses, and photos are unchanged by this update.
