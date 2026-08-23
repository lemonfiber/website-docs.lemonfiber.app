---
title: Forms and slices
description: Run only the part of the stack you need right now, compose slices together, and see what a form would start before you start it.
sidebar: { order: 1 }
---

Most self-hosted media stacks are one compose file with a dozen services in it:
all or nothing. Wanting to look one thing up means booting a media server, a
request portal, a subtitle daemon and four automation services.

That is not really a resource problem. It is that the tooling has no vocabulary
for _I only need part of this right now_. A **form** is that vocabulary.

## Forms and profiles

There are two layers, and only one of them is yours.

A **profile** is a fact about a service. Each service carries exactly one, and it
states what the service _is_: Sonarr is `tv`, SABnzbd is `usenet`, Jellyfin is
`media`. You never select a profile directly.

A **form** is an intent. It is a named combination of profiles, and it is what
you type. `tv` is a form meaning "I want automated television", which happens to
need the `search`, `usenet`, `torrent`, `tv` and `subs` profiles — because Sonarr
without indexers and a download client is not much use.

## The twelve profiles

| Profile   | What it covers                    | Services                                               |
| --------- | --------------------------------- | ------------------------------------------------------ |
| `search`  | Finding things                    | Prowlarr, FlareSolverr, NZBHydra2                      |
| `usenet`  | Usenet downloading                | SABnzbd                                                |
| `torrent` | Torrent downloading, VPN-isolated | Gluetun, qBittorrent                                   |
| `tv`      | Television automation             | Sonarr                                                 |
| `movies`  | Film automation                   | Radarr                                                 |
| `music`   | Music automation                  | Lidarr                                                 |
| `books`   | Book and audiobook automation     | Bindery                                                |
| `subs`    | Subtitle automation               | Bazarr                                                 |
| `media`   | Serving what you have             | Jellyfin, Seerr, Calibre-Web-Automated, Audiobookshelf |
| `tuning`  | Quality profiles and extraction   | Recyclarr, Unpackerr                                   |
| `dash`    | A page linking everything         | Homepage                                               |
| `proxy`   | Friendly hostnames                | Caddy                                                  |

Acquiring and serving are split deliberately. Bindery _acquires_ books and sits
in `books` alongside the other automation services; Calibre-Web-Automated and
Audiobookshelf _serve_ them and sit in `media` alongside Jellyfin. That is what
keeps `library` meaningful — you can serve an existing book collection without
running an acquisition service you have no indexers for.

## The eleven forms

| Form      | What it is for                                       | Profiles it expands to                                                            |
| --------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `search`  | Find things. Nothing else runs.                      | `search`                                                                          |
| `dl`      | You have a link — fetch it.                          | `usenet`, `torrent`                                                               |
| `hunt`    | Search and grab, manually.                           | `search`, `usenet`, `torrent`                                                     |
| `tv`      | Search, download and automate television             | `search`, `usenet`, `torrent`, `tv`, `subs`                                       |
| `movies`  | Search, download and automate film                   | `search`, `usenet`, `torrent`, `movies`, `subs`                                   |
| `music`   | Search, download and automate music                  | `search`, `usenet`, `torrent`, `music`                                            |
| `books`   | Search, download and automate books and audiobooks   | `search`, `usenet`, `torrent`, `books`                                            |
| `auto`    | Everything automated, nothing served                 | `search`, `usenet`, `torrent`, `tv`, `movies`, `music`, `books`, `subs`, `tuning` |
| `library` | Serve what exists. Requires no third-party accounts. | `media`                                                                           |
| `full`    | The lot.                                             | Everything except `proxy`                                                         |
| `proxy`   | Friendly hostnames. Layers onto any other form.      | `proxy`                                                                           |

`library` is the one worth noticing. It needs no indexer, no provider and no VPN,
which makes it the zero-cost end state for someone who already has a folder of
media.

## Ask before you start

Naming a form without starting anything tells you what starting it would come to:

```sh
$ lemonfiber forms
$ lemonfiber forms tv
```

The first lists every form the stack declares and what each is for. The second
describes just `tv` — the services it holds, and anything your configuration
leaves out.

That second part matters. A form's profiles are intersected with the protocols
you actually configured, so `lemonfiber up dl` on a Usenet-only setup starts
SABnzbd and does not try to start Gluetun with VPN credentials that do not exist.
Without that, every torrent-containing form would break for the large number of
people who run Usenet only.

So the number of services a form starts depends on your configuration, not just
on the form. `lemonfiber forms <name>` is the honest answer for your machine.

## Forms compose

Naming several forms starts the union of them:

```sh
$ lemonfiber up full proxy
```

A service that appears in more than one active form starts exactly once.
Duplicates are ignored. This is what makes `proxy` viable as a form rather than a
flag — a reverse proxy is an orthogonal concern that layers onto anything else.

## Changing the shape without tearing it down

To move from one set of forms to another, use `switch` rather than a `down`
followed by an `up`:

```sh
$ lemonfiber switch tv movies
```

Only what falls outside the new shape is stopped. A service both the old shape
and the new one hold keeps running rather than being restarted, so a download in
flight is not interrupted just to change the stack around it.

## When a form will not start

An unknown form name gets you the list of valid forms and the nearest match,
never a bare "not found". A form whose every profile has been filtered out by
your configuration is refused, naming the configuration that is missing.

If one service in a form fails to start, the rest keep running and you are told
which capability is degraded. A single failure never rolls back the whole form.

## Forms are data

Forms and profiles are declared in the stack manifest, not in lemonfiber's code.
Adding or changing one is a data change that needs no new release of the binary —
see [The stack manifest](/advanced/the-stack-manifest/) and [Adding a
service](/advanced/adding-a-service/).

## Related

- [The services](/running/the-services/) — what each of the nineteen actually does
- [Starting and stopping](/running/starting-and-stopping/) — what happens once you name a form
- [B1 Forms and partial stacks](/spec/10-functional/features/b-running/b1-forms/) — the requirements this page describes
