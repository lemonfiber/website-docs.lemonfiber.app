---
title: The envelope
description: The three fields every machine-readable payload arrives in, and the rules a client keeps that no schema can express.
sidebar:
  order: 1
---

Every machine-readable answer arrives in the same wrapper. There is no second
shape for a second surface: a script piping a command's output and a client
fetching the equivalent endpoint receive the same document.

```json
{ "api_version": 1, "kind": "walkthrough", "data": {} }
```

| Field         | Type    | Required | What it is                                                            |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `api_version` | integer | yes      | The output contract's version                                         |
| `kind`        | string  | yes      | Which payload this is, so a consumer can branch before parsing `data` |
| `data`        | object  | yes      | The payload                                                           |

All three are required. `kind` comes before `data` in importance rather than in
byte order: a client reads it first and then reads `data` **as that kind**, never
as an open value. The kinds and their payloads are
[every payload kind](/api/kinds/).

## On the command line

`--json` on any command. The answer goes to standard output; a failure is an
envelope too, of kind `error`, and it goes to the error stream instead — so a
script reading standard output never has to tell an answer from an apology.

A log stream is the one shape that is not a single document. It emits **one
envelope per line**, because a stream has no last element to close a document
with.

The plain-language footnote a human report prints under itself is never appended
to a machine-readable answer. It is prose for a person, and adding it would
corrupt the one thing that answer exists to be.

## The HTTP surface

`lemonfiber ui` serves the same envelope over local HTTP. It takes a loopback
socket — whichever port is free, unless `--port` names one — and prints the whole
address together with a token minted for that run. `--lan` offers it to your
network instead, and is refused until a password has been set with
`--set-password`. Nothing is installed, nothing keeps running afterwards, and the
connection is not encrypted, which it says as it starts.

Eighteen endpoints answer a question and close. Each one is a command a person
could have typed, dispatched through the same entry point the command line uses,
so the two surfaces cannot say different things about the same stack.

| Endpoint                 | What it answers                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `GET /api/status`        | What the whole stack is doing                                                           |
| `GET /api/services`      | The same reading, narrowed to the forms named in `?form=`                               |
| `GET /api/forms`         | Every form the stack declares, or what the ones named in `?form=` would come to         |
| `GET /api/checks`        | What the diagnostic checks found, or the one group named in `?only=`                    |
| `GET /api/storage`       | The checks about the disk                                                               |
| `GET /api/logs`          | The scrollback, one envelope per line; takes `?form=`, `?service=` and `?tail=`         |
| `GET /api/requests`      | What the household has asked for, narrowed to `?member=`                                |
| `GET /api/trace`         | Where one item got to; `?term=` names it as you would say it, `?season=` narrows to one |
| `GET /api/stuck`         | The items whose downloads have stopped, each named the way `?term=` asks for one        |
| `GET /api/config`        | Every setting, credentials withheld, or the one named in `?key=`                        |
| `GET /api/quality`       | The preset in force, what each preset means, and what it costs                          |
| `GET /api/version`       | The versions in play: lemonfiber, the stack it operates, and the container engine       |
| `GET /api/explain`       | Every word this product explains, or what the one named in `?word=` means               |
| `GET /api/front-door`    | The one address to hand somebody who lives here, and why nothing else listed is it      |
| `GET /api/outbound`      | Everything that leaves this machine, what each carries, and what switching it off stops |
| `GET /api/stored`        | What lemonfiber keeps on this machine, where each thing is, and why                     |
| `GET /api/backups`       | Which backups are here to restore from, by name                                         |
| `GET /api/bundle/{name}` | The support bundle itself, handed over rather than described                            |

The last two are not shaped like the rest. `GET /api/front-door` takes no parameters, because the question takes none: which one address the household is given is worked out from what the stack runs rather than asked for, and a parameter here would be a way for one surface to be told a different door from another. `GET /api/bundle/{name}` is the one read that does not answer with an envelope — it answers with the bundle itself, because a browser has no path on the host to be told and handing the file over is the only form `--out` can take on a screen. The name is resolved beneath the bundles directory rather than followed, so one carrying a path, or climbing out of that directory, is refused by name.

Query parameters are what the commands themselves take, and only what reads. A read
looks and does not touch: narrowing a diagnosis is a parameter here, while
accepting a warning or running the checks that disturb a running stack changes
something and belongs where changes are asked for.

`POST /api/actions/<name>` is where changes are asked for. An action that only
reads and writes lemonfiber's own files is answered with its outcome, because it
has already finished by the time it could be answered. One that reaches the
container engine runs for minutes, so it is answered `202` with a `job` envelope
naming the work, and the work runs somewhere the connection cannot reach — a
browser tab closed mid-repair takes nothing with it.

`GET /api/events` is a server-sent event stream, and it is described in full under
[what a client keeps](#what-a-client-keeps-that-the-schema-cannot-say) below. Each
event's name is the envelope's `kind`.

### When a read is refused

However a read is refused, it answers with the error envelope — the same document
`--json` writes — so the status is the only thing that tells one refusal from
another.

| Refused because                                                       | Status |
| --------------------------------------------------------------------- | ------ |
| What the request named is not one of the things there are             | `404`  |
| The request could not be answered as it was asked                     | `400`  |
| Nothing about the request was wrong; this machine could not answer it | `500`  |

The line between the first two is what the request was _for_. A word this product
does not explain is absent — the word is the whole of what `/api/explain` was asked
for, and there is no entry — while a parameter left out, given twice, or given a
value the surface does not offer is a request that could never have been answered
as it stands.

`500` is reserved rather than incidental. A client told the machine failed will try
again, and a client told that about a word with no entry will try forever. Which of
the three applies is decided where the refusal is raised, and it reaches a client as
the status alone: the envelope carries no field for it.

## What a request has to carry

Every request meets the same guard, applied over the whole route tree rather than
written into each handler — so an endpoint added later is guarded by having been
added.

| Header               | Rule                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-Lemonfiber-Token` | The run's token, on every request. The stream too: a connection held open is a request that has not finished, not one never made                                                 |
| `Host`               | Must name the address the server is listening on. A request without one is refused — a `Host` check is what still holds when DNS rebinding has defeated an origin check          |
| `Origin`             | Where a browser sent one, it must name the same address. Its absence is allowed, because it is a browser's word about itself and a client that is not a browser has none to give |

A refusal is prose, and says so. Nothing about which paths exist is disclosed to a
caller that has not been admitted: a path nothing serves is refused rather than
reported as missing.

## What is not built yet

**The binary carries no web app.** The app arrives as a pinned submodule at
`assets/web`, embedded exactly as the stack beside it is; that submodule does not
exist, so a build made today serves the API and no interface. What reads an
embedded app is built and proven — `lemonfiber ui --assets <dir>` serves a
directory instead, which is how the app is worked on before it is embedded — and
a request for a file when there is no app is answered plainly rather than with a
page.

**A job cannot be followed yet.** An action that runs for minutes answers with a
name for the work, and the stream carries the dashboard's state rather than that
job's progress. The name is what progress will arrive under; nothing emits it yet.

The contract and both SDKs were published ahead of all of this deliberately: the
boundary is a published shape rather than a compiler check, and publishing it
first is what stops two clients inventing two answers to the same question.

## What a client keeps that the schema cannot say

The generated artefact fixes what the wire **looks like**. These are the rules
about what it **means**, and every client implements and tests them.

| Rule                                                                                                                 | Why it is a rule rather than a suggestion                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The per-run token travels in the `X-Lemonfiber-Token` header, never in a URL                                         | URLs reach logs, history and referrers; a credential that lands in any of those has leaked                                                                                                                 |
| The base address must resolve to loopback, and a loopback address is not refused for being named rather than numeric | Refusing the word `localhost` outright is the wrong trade — it is what an operator types and what a printed address may contain. Refusing a name that resolves off loopback is the protection that matters |
| There is no default port                                                                                             | The binary chooses a free one unless told otherwise and prints the whole address; a client is configured with that address rather than assembling one                                                      |
| The stream emits a heartbeat at least every 15 seconds, and a client treats twice that in silence as broken          | Without it, "nothing has changed" and "the connection died twenty minutes ago" look identical                                                                                                              |
| Every event carries an `id`; a resuming client sends the last one it saw as `Last-Event-ID`                          | Resumption decides what is retransmitted, not what is current                                                                                                                                              |
| Anything held from before a gap is stale until replaced                                                              | A reconnected stream that presents pre-gap values as current is lying about what it missed                                                                                                                 |
| An `api_version` a client cannot speak is refused plainly, naming both versions                                      | Rendering a partial view of fields whose meaning has quietly changed is worse than stopping                                                                                                                |

## Where the shapes come from

The artefact is `contract/web-api.contract.json` in the lemonfiber repository,
built from the Rust types that actually serialise the reply. It is never
hand-written, and regenerating it must produce no diff — a serialised shape that
changes without the artefact changing with it fails the build rather than
reaching a client.

It is published with every release. An SDK does not fetch it while it builds; it
vendors a copy pinned to an exact revision recorded beside it, so a contract
change arrives as a diff somebody reads rather than as something that happens to
a build nobody was watching. Generating from a version an SDK does not implement
is refused, naming both versions, and writes nothing: types that compile and lie
are worse than a build that stops.

## Where to go next

[Every payload kind](/api/kinds/) lists what `data` holds for each `kind`. The
two numbers in play — the package version and `api_version` — do different jobs,
which is [two version numbers](/api/two-version-numbers/). To consume it from
code, start with [the TypeScript SDK](/api/typescript-sdk/) or
[the PHP SDK](/api/php-sdk/).
