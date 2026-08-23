---
title: Stuck downloads
description: Why a queue jams, how to tell the six ways apart, and what fixes each of them.
sidebar:
  order: 4
---

Setting a stack up is a one-day problem. Stuck items are the forever problem.

Once everything is running, the failure that recurs is not configuration — it is a queue that quietly jams. A download stalls at 94 per cent. An import fails because a file is locked, or the release is in a format nothing can extract, or a permission is wrong. An indexer returns nothing because its key expired.

Each service knows about its own stall, and none of them tells anyone. What you experience is simply that things stopped appearing.

## Start with the list

```sh
$ lemonfiber stuck
```

Each entry names the item, the service whose queue is holding it, and the stage its download reached — so you can follow any one of them on its own rather than being handed a count to investigate.

If a service's queue could not be read, the listing says so rather than reporting a short list as though nothing else were stuck.

## Then follow one item

```sh
$ lemonfiber trace "the thing you are waiting for"
```

A trace searches the way you would name it, not by an internal identifier, and reports how far it got. A show is reported season by season: how many episodes are here, and what each one that is not is waiting on. `--season` narrows it.

The stages, in order, are:

| Stage           | What has happened                              |
| --------------- | ---------------------------------------------- |
| `not-monitored` | Nobody has asked for it                        |
| `monitored`     | Wanted, and waiting to be searched for         |
| `searching`     | A search is running                            |
| `found`         | An indexer returned releases                   |
| `grabbed`       | A release was sent to the download client      |
| `downloading`   | The download is in progress                    |
| `downloaded`    | The download finished                          |
| `importing`     | The library service is importing it            |
| `imported`      | It is in the library on disk                   |
| `available`     | It is visible and playable in the media server |

Where a trace had to match a renamed release fuzzily, it says so rather than presenting a guess as a fact. [Where is my show?](/running/where-is-my-show/) covers reading one in full.

## The six ways a queue jams

The remedies differ, so the categories are worth telling apart.

| What you see                 | Where it stops                          | Usual cause                                                                 |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Stalled download             | `downloading`, and not moving           | A dead torrent with no seeders, or exhausted Usenet retention               |
| Completed and never imported | `downloaded`                            | Permissions, a name nothing can parse, or an archive that was not extracted |
| Repeated import failure      | `importing`, again and again            | Structural. It will not resolve itself.                                     |
| Waiting indefinitely         | `monitored`, never grabbed              | No releases match the quality preset, or the indexers are returning nothing |
| Orphaned download            | On disk, unknown to any library service | Added by hand, or the service lost track of it                              |
| Redownload loop              | Fetched over and over                   | An import failing silently and being retried forever                        |

**Completed and never imported is the one nobody owns.** The download client considers it finished. The library service never picked it up. Neither reports a problem, because from each service's own point of view there is not one. Only something watching both can see it.

**The redownload loop deserves its own attention.** It consumes bandwidth and Usenet allowance indefinitely while looking exactly like normal activity.

## Working out which one you have

Run the queue category, which is where these findings come from:

```sh
$ lemonfiber doctor --only queue
```

Then follow the trace, and read across from where it stopped.

### Stopped at `monitored` or `searching`

Nothing is being found. That is usually about the indexers or the quality preset rather than the download side.

- [`QUAL-2`](/fixing/every-error-by-code/#qual--quality-against-what-is-available) — releases exist and the preset wants none of them. The indexer is working; the preset is stricter than what is out there.
- [`QUAL-3`](/fixing/every-error-by-code/#qual--quality-against-what-is-available) — the indexer answered and there is nothing at all. Not a failure; there is nothing to grab yet.
- [`CRED-2`](/fixing/every-error-by-code/#cred--credentials-a-service-refuses) — the indexer rejected its key. Searches through it come back empty.
- [`CRED-3`](/fixing/every-error-by-code/#cred--credentials-a-service-refuses) and [`PROVIDER-9`](/fixing/every-error-by-code/#provider--accounts-and-indexers) — the key is fine and the indexer is limiting or has spent its allowance. Waiting fixes it.
- [`PROVIDER-4`](/fixing/every-error-by-code/#provider--accounts-and-indexers) — one indexer has been failing and its aggregator has rested it. Releases are still found, from a smaller pool.
- [`PROVIDER-5`](/fixing/every-error-by-code/#provider--accounts-and-indexers) — every indexer is failing at once. Indexers do not all fail on the same afternoon, so look at this machine's network, its DNS, and the tunnel if searches run through one.

[Quality presets](/running/quality-presets/) covers changing what the preset asks for.

### Stopped at `grabbed` or `downloading`

Something was sent to the download client and is not progressing.

- On Usenet, check the account: [`PROVIDER-1`](/fixing/every-error-by-code/#provider--accounts-and-indexers) means it has nothing left, [`PROVIDER-6`](/fixing/every-error-by-code/#provider--accounts-and-indexers) means it is refusing the login, [`PROVIDER-7`](/fixing/every-error-by-code/#provider--accounts-and-indexers) means it stopped answering, and [`PROVIDER-8`](/fixing/every-error-by-code/#provider--accounts-and-indexers) means the client is opening more connections than the plan allows.
- On torrents, check that peers can reach you. [`VPN-4`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) and [`VPN-7`](/fixing/every-error-by-code/#vpn--traffic-leaving-the-tunnel) both mean no peer can open a connection to your client, which reads as a slow download rather than as a fault. [Is my VPN hiding me?](/fixing/is-my-vpn-hiding-me/) covers both.
- A genuinely slow large release on a slow connection is not broken, and is reported as slow rather than stalled.

### Stopped at `downloaded` or `importing`

The file is on disk and is not reaching the library. This is nearly always storage or wiring.

- [`STORAGE-2`](/fixing/every-error-by-code/#storage--the-data-location) and [`STORAGE-6`](/fixing/every-error-by-code/#storage--the-data-location) — the services cannot write where they need to. Imports fail inside the service, far from where the cause is.
- [`STORAGE-4`](/fixing/every-error-by-code/#storage--the-data-location) — the disk is full or projected to fill. A disk that fills partway through an import leaves half a file behind and stalls everything behind it.
- [`WIRING-1`](/fixing/every-error-by-code/#wiring--drift-between-services) — the download client is filing under a category the rest of the stack no longer looks in, or the service can no longer reach the client at all. `lemonfiber doctor --fix` offers to put it right.
- [`SEED-1`](/fixing/every-error-by-code/#seed--wiring-the-services-together) and [`SEED-2`](/fixing/every-error-by-code/#seed--wiring-the-services-together) — the wiring between two services was never completed, or its credential has gone stale.

[Hardlinks and one mount point](/fixing/hardlinks-and-one-mount-point/) covers the storage side in full.

### Stopped at `imported`, never `available`

The file is in the library on disk and the media server has not picked it up. The trace distinguishes "the media server answered and does not have it" from "the media server could not be reached", so read which one you got: the first is a library that has not been scanned, the second is not an answer at all.

## What lemonfiber will fix for you

Where a stall has one unambiguous action — retrying an import, cleaning up an orphan — it is offered rather than applied silently.

```sh
$ lemonfiber doctor --fix
```

Each repair says what it would do and what else changes if it does, and waits to be told. See [run the doctor](/fixing/run-the-doctor/).

## Thresholds

"Stuck" is a judgement, and the defaults are deliberately conservative. A torrent with no seeders may recover in a day; one that has not moved in a week will not. A false report of "stuck" trains you to ignore the feature, which costs more than the occasional late warning.

## Related

- [Every error by code](/fixing/every-error-by-code/) — every code named on this page
- [Where is my show?](/running/where-is-my-show/) — reading a trace in full
- [Requests and the household](/running/requests-and-the-household/) — what was asked for, and by whom
- [C7, queue health and stuck items](/spec/10-functional/features/c-trust/c7-queue-health/) — the requirement this is written against
