---
title: Where is my show?
description: Follow one item across every service that touched it, find out exactly where it stopped, and tell the five kinds of "nothing happened" apart.
sidebar: { order: 6 }
---

"Where is my show?" is the most common question in any household running this,
and answering it by hand means opening four web interfaces and correlating
timestamps. Was it found? Was it grabbed? Did it download? Did it import? Each
service holds one fragment, and none of them link to each other.

```sh
$ lemonfiber trace "the expanse"
```

Search the way you would say it — by show name, film title, or a household
member's request — not by an internal identifier.

## What you get back

Every stage names the service that handled it, when, and the outcome. The stage
where it stopped carries the reason and a remedy:

```text
  The Expanse · Season 4 · Episode 3

  ✓ Monitored          Sonarr            3 days ago
  ✓ Found              Prowlarr          2 days ago    47 results, best: 1080p WEB
  ✓ Grabbed            SABnzbd           2 days ago    2.4 GB
  ✓ Downloaded         SABnzbd           2 days ago    took 4m 12s
  ✗ Import failed      Sonarr            2 days ago
       Permission denied writing to /data/media/tv/The Expanse
       → the media directory isn't writable by the container
```

The hard part — and the whole value — is the correlation. A release name in
Prowlarr, a job in SABnzbd, a queue item in Sonarr and a file on disk are four
different identifiers for one thing. lemonfiber joins them so you do not have to.

## The stages

An item moves through these in order:

| Stage         | What it means                                               |
| ------------- | ----------------------------------------------------------- |
| Not monitored | Nobody has asked for it — no automation service is watching |
| Monitored     | Watched, waiting to be searched for                         |
| Searching     | A search is running                                         |
| Found         | An indexer returned releases                                |
| Grabbed       | A release was sent to the download client                   |
| Downloading   | The download is in progress                                 |
| Downloaded    | The download finished                                       |
| Importing     | The automation service is filing it into the library        |
| Imported      | It is on disk, in the library                               |
| Available     | It is visible and playable in the media server              |

## The five kinds of nothing

Content that simply never appears is the most confusing case, because every cause
looks identical from outside. A trace tells them apart:

- **Not monitored** — nobody actually asked for it
- **Monitored, never found** — the indexers returned nothing
- **Found, never grabbed** — nothing met your [quality preset](/running/quality-presets/)
- **Grabbed, never downloaded** — the download client rejected or lost it
- **Downloaded, never imported** — the silent failure, and the most common one

Each of those has a completely different remedy. Knowing which one you are
looking at is most of the work.

## Following one season

A show is reported season by season: how many episodes are here, and what each
one that is not is waiting on. Otherwise a series reads as done the moment one
episode lands.

```sh
$ lemonfiber trace "the expanse" --season 4
```

## When lemonfiber is not sure

Where a release was renamed between stages, correlation falls back to fuzzy
matching, and the trace says the match is uncertain rather than presenting a
guess as fact.

Where two services disagree about the state of one item, both views are shown and
the disagreement is flagged. That is a real finding, not a display problem.

Where the history has been rotated away, or the item predates your lemonfiber
installation, the trace reports the detail as unavailable rather than inferring
that nothing happened. History is read over a bounded window, and lemonfiber
states that horizon rather than implying it has seen everything.

## Starting from what is stuck

You do not have to know what to ask about. Anything the queue reports as stuck
lands here:

```sh
$ lemonfiber stuck
```

That lists the items whose downloads are stuck, each named so that `lemonfiber
trace` can follow it on its own. It is the landing point for a dashboard that
says "3 stuck" — a list of explanations rather than a list of things to go and
investigate. See [Stuck downloads](/fixing/stuck-downloads/) for what to do about
each cause.

## Watching it happen instead

A trace answers "where did it get to?" after the fact. If you would rather watch
one item go through the whole pipeline live:

```sh
$ lemonfiber walkthrough
```

That searches, grabs, downloads, imports and shows the result appear in the
library, narrating each step. Name something, or name nothing and be suggested
something likely to work. If a link in the chain is broken this is where it
shows, with the step named and a way out.

Both use the same set of stages deliberately, so the live view and the
after-the-fact view never drift into two vocabularies for one journey.

## Scripting it

```sh
$ lemonfiber trace "dune part two" --json
```

Every command takes `--json` and prints a machine-readable form. See [Global
flags](/commands/global-flags/) and [the API](/api/).

## What the household sees

Household members get a simplified view of their own requests through Seerr —
enough to know whether something is on its way, without the diagnostic detail.
That is [Requests and the household](/running/requests-and-the-household/).

## Related

- [Stuck downloads](/fixing/stuck-downloads/) — the remedies for each stall
- [Hardlinks and one mount point](/fixing/hardlinks-and-one-mount-point/) — the usual cause of "downloaded, never imported"
- [D9 Pipeline trace](/spec/10-functional/features/d-content/d9-pipeline-trace/) — the requirements behind this page
