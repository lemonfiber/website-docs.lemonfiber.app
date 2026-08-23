---
title: Words we use
description: The vocabulary this ecosystem assumes you already have, and the handful of words that belong to lemonfiber itself.
sidebar: { order: 4 }
---

This corner of the world has a vocabulary, and most guides assume you arrived
with it. You did not have to, and you do not have to learn it up front either.

Every lemonfiber report explains the words it used underneath itself, in a
sentence, so you can act on what you are reading without leaving it. When you
want the longer form, ask:

```sh
$ lemonfiber explain hardlink
```

Nothing needs the longer explanation in order to act. That is the difference
between an explanation offered and one imposed.

## Finding things

| Word          | What it means                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Indexer       | A search engine that finds what you are looking for. You need at least one, and most cost a small yearly fee. Prowlarr lists Usenet indexers and torrent sites together under this one word. Also called a search provider. |
| Backbone      | The network a Usenet provider actually stores its articles on. Two providers sharing one hold the same things, so a second account there finds nothing the first could not.                                                 |
| Retention     | How far back your Usenet provider keeps things. Measured in days, and it is the age of the post rather than of the film. Short retention is fine for new things and quietly fails on old ones.                              |
| Block account | Usenet data bought as a fixed amount rather than a monthly allowance. Useful as a second provider, since you spend it only on what the first could not find.                                                                |

## Getting things

| Word    | What it means                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Usenet  | One of the two ways this stack downloads. You pay a provider, downloads are fast and private, and nothing is expected of you afterwards. Also called NNTP.                     |
| NZB     | What your indexer hands the download client so it can fetch the pieces of a Usenet download. You rarely handle one yourself.                                                   |
| Torrent | The other way this stack downloads. Free, and you share back what you take — which is why it goes through the VPN.                                                             |
| Peer    | Somebody else sharing the same torrent. You take from them and they take from you, which is why a torrent with nobody on it never finishes.                                    |
| Seed    | To keep sharing a finished torrent so others can take it. Stopping too early is what a ratio requirement is about.                                                             |
| Ratio   | How much you have shared back compared with what you took. Some trackers expect a minimum before they let you keep downloading.                                                |
| Grab    | To send a release to the download client — the moment something stops being a search result and starts being a download. Also called a snatch.                                 |
| Stalled | A download that has stopped making progress without failing outright. It sits there until something moves it, which is why it is worth naming rather than counting as running. |

## Staying hidden

| Word            | What it means                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| VPN             | A tunnel your torrent traffic leaves through, so your own connection is not the one seen doing it. lemonfiber checks that the traffic genuinely leaves through the tunnel rather than trusting that it was configured to.                        |
| Killswitch      | Stops the torrent client reaching the internet at all if the VPN drops, rather than letting it carry on unprotected.                                                                                                                             |
| Port forwarding | A way back in for other peers, opened by your VPN. Without it they cannot start a connection to you, so torrents are slower and your ratio suffers. Only a minority of providers offer it, which is why it is worth asking before you subscribe. |

See [Is my VPN hiding me?](/fixing/is-my-vpn-hiding-me/) for how that first claim
is actually verified rather than assumed.

## Filing things

| Word        | What it means                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monitored   | Whether a service is still looking for something. Unmonitored means it will not go and find it even when it is missing, which is the usual reason nothing is happening.                           |
| Root folder | Where a service files what it has finished with — the library it manages, rather than the folder downloads land in. Also called a library folder.                                                 |
| Hardlink    | Lets one file appear in two places while taking up the space once, so importing is instant and costs no extra disk. Both names point at the same data, and deleting one leaves the other working. |

Hardlinking is why the download folder and the library have to sit on one volume.
Across two, the file has to be copied instead — slower, twice the room, and it
breaks seeding.

## Quality

| Word            | What it means                                                                                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quality profile | The rules deciding which version of something is good enough to grab, and which is worth replacing later. Resolution is only part of it: a profile also weighs the source, the encoder and the audio. |
| Custom format   | A rule that nudges a profile for or against particular releases — a preferred group, or a thing you never want.                                                                                       |
| Bitrate         | How much data each second of sound or video uses. Higher means better quality and larger files, which is the whole of the trade.                                                                      |
| Transcode       | Rebuilding a video into a form the device asking for it can play. It costs a great deal of processing, so a machine doing it often is one that feels slow.                                            |
| HDR             | A wider range of brightness and colour than a screen normally shows. It needs a display that can take it; on one that cannot, the picture can look washed out.                                        |

You do not have to choose any of this by hand. [Quality
presets](/running/quality-presets/) asks the question you actually have — how
good, and how much disk — and translates it.

## lemonfiber's own words

| Word           | What it means                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Form           | A named slice of the stack, chosen by what you want to do: `search`, `dl`, `tv`, `library`, `full`. Forms are what you name on the command line.                                                                                     |
| Profile        | A tag on a service saying what it _is_, rather than what you want. You never select one directly; forms are made of them.                                                                                                            |
| Data root      | The single directory holding both `downloads/` and `media/`, mounted into every container. The one that has to be a single filesystem.                                                                                               |
| Stack manifest | The file declaring the services, profiles and forms. Everything lemonfiber knows about the stack comes from there, which is why adding a service is a data change rather than a code change.                                         |
| Seed           | Confusingly, also lemonfiber's word for wiring the services to each other through their APIs — `lemonfiber seed`. Nothing to do with torrent seeding; the two words simply collided in this domain long before either of us arrived. |
| Drift          | A value you changed by hand that no longer matches what lemonfiber expects. Reported, never silently reverted.                                                                                                                       |

Two of those have their own pages: [Forms and
slices](/running/forms-and-slices/) and [The stack
manifest](/advanced/the-stack-manifest/). Drift, and what to do about it, is in
[Adopt and reset](/advanced/adopt-and-reset/).

## The longer definitions

The specification keeps its own [glossary](/spec/00-overview/glossary/), which is
more precise and less friendly than this page. Where a word has a loose
colloquial meaning and a specific one, that is the page where the specific one
wins.
