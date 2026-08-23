---
title: The services
description: All nineteen services in the stack, what each one does, what you lose without it, and which form starts it.
sidebar: { order: 2 }
---

The stack is nineteen services. You will rarely run all of them at once —
[forms](/running/forms-and-slices/) exist precisely so you do not have to — but
it is worth knowing what each one is for, because every diagnostic and every
trace names them.

Everything here comes from the stack manifest, which is where lemonfiber gets it
too. Nothing in this table is hardcoded in the binary.

## What each one does

The last column names the smallest form that starts each service. Broader forms
include it as well: anything in `search` is also started by `hunt`, `tv`,
`movies`, `music`, `books`, `auto` and `full`.

| Service               | What it does                                                                  | Without it                                        | Smallest form |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------- |
| Prowlarr              | Holds your indexer accounts in one place and shares them with everything else | Every app needs indexers configured separately    | `search`      |
| FlareSolverr          | Gets past bot-protection on some indexers                                     | Those indexers return nothing                     | `search`      |
| NZBHydra2             | A search box across all your Usenet indexers at once                          | Search one indexer at a time                      | `search`      |
| SABnzbd               | Downloads from Usenet                                                         | No Usenet downloads                               | `dl`          |
| Gluetun               | Routes torrent traffic through your VPN and blocks it if the VPN drops        | Your home IP is visible to every peer             | `dl`          |
| qBittorrent           | Downloads torrents                                                            | No torrent downloads                              | `dl`          |
| Sonarr                | Watches for new episodes and fetches them                                     | Find and download episodes yourself               | `tv`          |
| Radarr                | Watches for films and fetches them                                            | Find and download films yourself                  | `movies`      |
| Lidarr                | Watches for music and fetches it                                              | Find and download music yourself                  | `music`       |
| Bindery               | Watches for books and audiobooks and fetches them                             | No book automation, since Readarr is discontinued | `books`       |
| Bazarr                | Finds and downloads subtitles                                                 | No automatic subtitles                            | `tv`          |
| Jellyfin              | Plays your library on TVs, phones and browsers                                | Files on disk, no way to watch them               | `library`     |
| Seerr                 | Where the household asks for things                                           | Requests come to you in person                    | `library`     |
| Calibre-Web-Automated | Reading and organising your ebook library                                     | No ebook reader                                   | `library`     |
| Audiobookshelf        | Listening to audiobooks, with progress synced                                 | No audiobook player                               | `library`     |
| Recyclarr             | Keeps quality settings in line with community guidance                        | Tune quality profiles by hand                     | `auto`        |
| Unpackerr             | Extracts archived releases so they can be imported                            | Some downloads never import                       | `auto`        |
| Homepage              | One page linking everything, with live status                                 | Remember a dozen URLs and ports                   | `full`        |
| Caddy                 | Friendly hostnames instead of ports                                           | Use `localhost:8989` and friends                  | `proxy`       |

Bazarr is reached by `movies` as well as `tv`; both forms include the `subs`
profile.

## Where each one listens

Binding is two-tier, and it is a default rather than a setting you have to find.

**Administrative interfaces bind to loopback.** The automation services and the
download clients answer only on `127.0.0.1`, because nothing on your network has
any business reaching them.

| Service      | Address          |
| ------------ | ---------------- |
| NZBHydra2    | `localhost:5076` |
| Bazarr       | `localhost:6767` |
| Radarr       | `localhost:7878` |
| qBittorrent  | `localhost:8081` |
| SABnzbd      | `localhost:8085` |
| FlareSolverr | `localhost:8191` |
| Lidarr       | `localhost:8686` |
| Bindery      | `localhost:8787` |
| Sonarr       | `localhost:8989` |
| Prowlarr     | `localhost:9696` |

**Household-facing surfaces bind to the LAN**, because they are useless if a
television cannot reach them: Jellyfin on `8096`, Seerr on `5055`,
Calibre-Web-Automated on `8083`, and Audiobookshelf on `13378`. Homepage joins
them on `3000` — a dashboard nobody else can open is not much of a dashboard —
and Caddy answers on `80` when you run the `proxy` form.

Nothing binds to every interface. Reaching any of this from outside the house is
[Remote access](/advanced/remote-access/), which is a deliberate decision rather
than a default.

Gluetun, Recyclarr and Unpackerr publish no port at all. Gluetun is a network
namespace that qBittorrent runs inside; the other two are scheduled jobs with no
interface.

## The two that are not like the others

**Gluetun** is the only service granted network administration capability, and
the only one marked critical rather than core. If it is unhealthy, torrent
traffic is not protected — which is a different class of problem from a service
being down, because the failure is invisible from inside the stack. That is what
[Is my VPN hiding me?](/fixing/is-my-vpn-hiding-me/) exists to answer.

**Bindery** fills the automation role for books, but it is not one of the
Servarr family and does not share their API. Prowlarr's application sync does not
cover it, so it consumes indexer endpoints directly.

## How much a service failing matters

The manifest grades each service, and lemonfiber's health summary uses that
grading rather than counting containers:

| Grade     | Meaning                                      | Examples                                                                                               |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Critical  | Failure has consequences outside the machine | Gluetun                                                                                                |
| Core      | The stack cannot do its job without it       | Prowlarr, SABnzbd, qBittorrent, Sonarr, Radarr, Lidarr, Bindery                                        |
| Important | The household notices immediately            | Jellyfin, Seerr                                                                                        |
| Enhancing | Something works less well                    | FlareSolverr, NZBHydra2, Bazarr, Calibre-Web-Automated, Audiobookshelf, Recyclarr, Unpackerr, Homepage |
| Optional  | Convenience only                             | Caddy                                                                                                  |

This is why a stack with every container running and a leaking VPN does not
report that everything is fine.

## Versions and licences

Every image is pinned to an explicit version tag in the manifest. Nothing changes
because time passed — an update happens when you decide it should. See
[Updating](/running/updating/).

The manifest also records each service's licence and upstream project. All
nineteen are open source; lemonfiber's own licence is separate and stricter.

## Related

- [Forms and slices](/running/forms-and-slices/) — how these group into slices
- [The stack manifest](/advanced/the-stack-manifest/) — the file this page is drawn from
- [Adding a service](/advanced/adding-a-service/) — making the list twenty
- [F2 Service catalogue](/spec/10-functional/features/f-extensibility/f2-service-catalogue/) — the requirement behind it
