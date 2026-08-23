---
title: Quality presets
description: Choose how good your media should look in plain language, see what it costs in disk, and change your mind later without breaking anything.
sidebar: { order: 4 }
---

Quality configuration is the deepest rabbit hole in this ecosystem. The community
guides are excellent and run to dozens of pages of custom formats, scoring,
release groups and repack handling. Doing it properly by hand takes an evening
and real domain knowledge.

Your actual question is simpler: _how good should this look, and how much disk am
I willing to spend?_ Everything else is implementation.

## The four presets

| Preset         | Means                                       | Resolution                  | Roughly                 | Playback                                                                                                             |
| -------------- | ------------------------------------------- | --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `space-saving` | Good enough on a laptop or tablet           | 720p–1080p, smaller encodes | about 0.5–1 GB per hour | plays directly on virtually any device                                                                               |
| `balanced`     | Looks right on a TV, at sensible file sizes | 1080p, good encodes         | about 2–3 GB per hour   | plays directly on most devices                                                                                       |
| `high-quality` | The best 1080p available; size is secondary | 1080p, high-bitrate         | about 4–6 GB per hour   | plays directly on most devices; a weak client may transcode                                                          |
| `maximum`      | 4K where it exists, with HDR preserved      | 2160p, HDR preserved        | about 10–25 GB per hour | 4K HDR often needs transcoding on a device that cannot play it directly, which is CPU-bound without hardware support |

`balanced` is the default, and it is the right answer far more often than people
expect.

## Seeing where you stand

```sh
$ lemonfiber quality show
```

That reports the choice in force and what each preset means and costs, so you can
compare before changing anything.

## Choosing

```sh
$ lemonfiber quality set balanced
```

Different media types can differ. Maximum for film and balanced for television is
a common and sensible split, because a series is many times the volume of a film:

```sh
$ lemonfiber quality set maximum --for movies
$ lemonfiber quality set balanced --for tv
```

The media type is `tv` or `movies`.

### The transcoding warning

If you choose a preset this machine would have to transcode in software,
lemonfiber says so before applying it and waits for you to confirm:

```sh
$ lemonfiber quality set maximum --confirm
```

This is not a formality. Choosing maximum on a machine that cannot hardware
transcode means every household member watching on a device that cannot play 4K
HDR directly hits CPU-bound transcoding — which on Docker for macOS or Windows
does not work well. lemonfiber knows your platform and how Jellyfin is running,
so it can tell you before the choice rather than after the complaints.

## Changing a preset only affects what comes next

This is the expectation people most often have backwards. A preset change applies
to future acquisitions. It does not go back through your library and re-download
what is already there.

If that is genuinely what you want, it is a separate, explicit action, because it
is large and expensive in bandwidth:

```sh
$ lemonfiber quality upgrade
$ lemonfiber quality upgrade --confirm
```

The first run states the cost and does nothing. The second triggers the
re-search, having let you see what you are asking for.

## Your own tuning is safe

Presets are a starting point, not a ceiling. Under the surface they map onto the
community-maintained quality profiles that Recyclarr syncs, rather than a
parallel scoring system of lemonfiber's own — so when release-group scoring
shifts upstream, your profiles follow it instead of rotting.

If you hand-edit those profiles, lemonfiber notices and reports the configuration
as customised. It does not overwrite your work. Applying a preset over hand edits
takes explicit consent:

```sh
$ lemonfiber quality reapply
```

That re-asserts the recorded preset over a Recyclarr configuration you have
edited. An ordinary run keeps your edits; this is the command that lets the
preset win instead. The same protection covers the rest of the stack — see
[Adopt and reset](/advanced/adopt-and-reset/).

## When the upstream guides are unreachable

Your existing profiles stay exactly as they are, and lemonfiber reports that the
sync is stale. It never falls back to unconfigured, because a quiet return to
defaults is the kind of change nobody notices until the wrong releases start
arriving.

## Books and audiobooks

Resolution is not a meaningful axis for a book, so those media types are
presented with format preferences instead of a picture-quality preset.

## When nothing matches

A preset that no available release satisfies is reported as exactly that —
distinct from an indexer that is failing. The two look identical from outside
(nothing arrives) and have completely different remedies: relax the preset, or
fix the indexer.

If you are not sure which is happening, [Where is my
show?](/running/where-is-my-show/) will tell you whether releases were found and
rejected, or never found at all.

## Related

- [Words we use](/start/words-we-use/) — quality profile, custom format, bitrate, transcode
- [D2 Quality presets in plain language](/spec/10-functional/features/d-content/d2-quality-presets/) — the requirements behind this page
