---
title: Your first stack
topic: use
description: Run setup, answer the questions it cannot answer for you, and watch one thing download from end to end.
sidebar: { order: 3 }
---

With the binary on your `PATH` and Docker running, type one word:

```sh
$ lemonfiber
```

On a machine with nothing configured, that offers first-time setup. It is not
hidden behind a subcommand you would have to know to look for. If you would
rather be explicit, `lemonfiber setup` does the same thing.

## What setup asks, and why

A question is only asked if lemonfiber cannot work the answer out for itself, the
answer changes what happens, and you can plausibly answer it. That is why your
timezone is never asked, and why the container user is asked only where file
ownership is visible.

| Step          | What happens                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Welcome       | States what is about to happen and roughly how long it will take.                                            |
| Preflight     | Detects your operating system, checks Docker and Compose, and checks the Docker daemon can be reached.       |
| Protocols     | Usenet, torrents, both, or neither.                                                                          |
| Prerequisites | The account checklist, derived from what you just chose. Nothing is shown for a protocol you declined.       |
| VPN           | Whether a VPN carries the torrent traffic. Asked only if you chose torrents.                                 |
| Data location | Where downloads and the library are kept. Proposes a default, then creates a hardlink there and inspects it. |
| Credentials   | The indexer credential, tested against the live service. Asked only if you chose a download protocol.        |
| Provider      | The Usenet provider login, tested over NNTP. Asked only if you chose Usenet.                                 |
| Service user  | The user and group the containers run as. Asked only where file ownership is visible.                        |
| Library       | Whether to run Jellyfin, and how.                                                                            |
| Household     | Whether other people in the home will use it.                                                                |
| Notifications | How much you want to be told about: one question, three presets.                                             |
| Autostart     | Whether the stack should start when the machine boots.                                                       |
| Review        | A complete summary of every value that will be written. Nothing has touched the disk yet.                    |

Once you confirm the review, setup writes the configuration, creates the
directories and the stack files, and starts the stack. It ends by offering to
fetch one thing for you, and takes no for an answer.

Two things about that table are worth saying plainly.

**Nothing is written until you confirm the review.** Everything up to that point
is read-only, apart from a small progress file. You can abandon setup at any
point and leave nothing behind.

**It is resumable, not restartable.** Quitting mid-way keeps your answers, and
the next run picks up at the step you reached. If an apply is interrupted, the
next run detects it, tells you exactly what was written, and offers to resume,
roll back, or start over.

## The zero-cost path

Declining both protocols is a supported answer, not a lesser one. Setup skips the
account checklist and the credential steps entirely, and you end up with a
working Jellyfin over the media you already have — no subscriptions, no indexers,
no spend.

You can add protocols later without redoing any of this.

## Running it unattended

Every question has a flag. Given all of them plus `--yes`, setup runs without a
terminal:

```sh
$ lemonfiber setup --yes \
    --protocols usenet \
    --data-location /srv/media \
    --usenet-host news.example.net \
    --usenet-user alice \
    --usenet-pass "$USENET_PASS" \
    --indexer-url https://indexer.example.net \
    --indexer-key "$INDEXER_KEY" \
    --library docker \
    --autostart true
```

A non-interactive run that is missing a flag it needs is told which flag, rather
than left waiting on input that will never arrive. `--dry-run` says what would
happen and changes nothing.

The full list of flags is in [Every command](/commands/every-command/).

## After setup finishes

Setup starts the stack and waits for the services to become healthy, so by the
time it returns you have something running. It does not connect the services to
each other, so that comes first.

**Wire the services to each other.**

```sh
$ lemonfiber seed
```

That connects them through their own APIs: the indexers to the automation
services, the automation services to the download clients, and the rest. It is
safe to run again; a link already in place is left alone. Then three things are
worth doing.

**Watch one item go through the pipeline.**

```sh
$ lemonfiber walkthrough
```

This searches the indexers, grabs a release, downloads it, imports it, and shows
it appear in the library — narrating each step as it happens. Name something, or
name nothing and be suggested something likely to work. If any link in the chain
is broken, this is where it shows, with the step named and a way out. It is the
fastest way to end up with a mental model of what your stack actually does.

**Check what is running.**

```sh
$ lemonfiber ps
```

That reports what each service is really doing, rather than whether a container
process exists.

**Prove it is doing the right thing.**

```sh
$ lemonfiber doctor
```

The doctor runs the checks that turn assumptions into assertions — is the VPN
genuinely carrying the torrent traffic, are imports hardlinking, is there disk
headroom. See [Run the doctor](/fixing/run-the-doctor/).

## Where to go from here

- [Forms and slices](/running/forms-and-slices/) — starting only the part you need
- [The services](/running/the-services/) — what each of the twenty-three does
- [Words we use](/start/words-we-use/) — the vocabulary the services assume you have
- [J1 First run](https://lemonfiber.app/spec/10-functional/journeys/j1-first-run/) — the same journey, written as a specification
