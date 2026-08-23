---
title: Requests and the household
description: How everyone else in the home asks for things, and how you see where each request stands without opening another web interface.
sidebar: { order: 5 }
---

This is the one part of the stack whose main audience is not you.

For a partner, a housemate or a teenager, **the product is Seerr and Jellyfin**.
They will never see a terminal, a form or a diagnostic. Their whole experience is:
search for something, ask for it, and later it is there.

If that experience is poor you hear about it constantly, and the stack gets judged
a failure no matter how well the rest of it works.

## One account, one door

A household member signs in with their Jellyfin account — the same credentials
that let them watch. Seerr authenticates against Jellyfin, so there is no second
registration and no second password to lose.

Send people to **Seerr**, not to Jellyfin. Jellyfin is where they watch, but it is
where they _finish_. Someone who lands there can only play what already exists,
and their next move when something is missing is to ask you in person — which is
the interruption the stack was installed to remove. Seerr is where a request
begins, shows its status, and links onward to playback.

Both bind to your LAN rather than to loopback, because they are useless if a
television cannot reach them. Neither is reachable from outside the house by
default; that is [Remote access](/advanced/remote-access/), and it is a decision
rather than an accident.

## The loop has to close

The failure to avoid is silence. A request that disappears into nothing reads as
being ignored.

Seerr tells the requester at each point — received, approved or declined,
being worked on, ready to watch. lemonfiber's job is to make sure it is
configured to, because the default of silence is what produces "did you get my
request?"

## Seeing where everything stands

```sh
$ lemonfiber household
```

That shows what the household asked for and where each request stands, grouped by
whoever asked, in the words they would use rather than the services' own. You do
not have to open Seerr to find out that something needs attention.

To narrow it to one person, named the way you would say it:

```sh
$ lemonfiber household --member ana
```

Each request is named so you can follow it on its own with [`lemonfiber
trace`](/running/where-is-my-show/), which gives you the full per-service detail
behind the one-word summary.

### The words a request is reported in

| State                | What it means                                                       |
| -------------------- | ------------------------------------------------------------------- |
| Waiting for approval | Asked for, and nobody has approved or refused it yet                |
| Declined             | Turned down — it will not be fetched                                |
| Getting              | Approved and on its way: being searched for, downloaded or imported |
| Partly here          | Some of it is here — a series with only some of its episodes        |
| Here                 | Here, and playable                                                  |
| Failed               | Approved, but the attempt to fetch it failed                        |
| Gone                 | It was here and has since been removed                              |

These are deliberately coarser than the pipeline stages a trace reports. Someone
who asked for a film does not need to know that a release was grabbed but not
imported; they need to know whether it is here yet, and if not, whether anyone is
still working on it.

## What can be asked for

The request surface reflects what your stack is actually configured to deliver.
Asking for television is meaningless if Sonarr is not running, so it is not
offered. Nobody is offered something and then refused.

A request for something already in the library is answered immediately with a
link to it, rather than accepted and quietly deduplicated. Something not yet
released is accepted and marked as awaiting release, because that is not a
failure.

## Household accounts

Getting people accounts is Jellyfin user administration today. lemonfiber has no
command for creating a household member, issuing an invitation or resetting
somebody's password — the behaviour is specified in [D6 Household identity and
invitations](/spec/10-functional/features/d-content/d6-household-identity/), and
it is not built yet.

What that specification asks for is worth knowing about even so, because it sets
the shape: you create an invitation, the household member sets their own
password, and you never choose or transmit somebody else's credentials.

## The household never touches lemonfiber

There is no lemonfiber account for a household member, no lemonfiber URL to give
them, and no way for them to affect the stack's operation even accidentally. The
boundary is deliberate.

## Related

- [Where is my show?](/running/where-is-my-show/) — the detailed answer behind a request's one-word state
- [The services](/running/the-services/) — Seerr, Jellyfin, and where they listen
- [D4 Household request flow](/spec/10-functional/features/d-content/d4-request-flow/) — the requirements behind this page
- [J9 Getting the household watching](/spec/10-functional/journeys/j9-household/) — the same story end to end
