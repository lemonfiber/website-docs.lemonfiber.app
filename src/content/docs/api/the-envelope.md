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

## Where you get one today

`--json` on any command. The answer goes to standard output; a failure is an
envelope too, of kind `error`, and it goes to the error stream instead — so a
script reading standard output never has to tell an answer from an apology.

A log stream is the one shape that is not a single document. It emits **one
envelope per line**, because a stream has no last element to close a document
with.

The plain-language footnote a human report prints under itself is never appended
to a machine-readable answer. It is prose for a person, and adding it would
corrupt the one thing that answer exists to be.

## The HTTP surface is specified and not yet built

The [web API contract](/spec/20-architecture/contracts/web-api/) describes a local
HTTP surface carrying exactly this envelope: one endpoint per command that
supports `--json`, named for the command, with query parameters mirroring the
command's flags; `POST /api/actions/<name>` for anything that changes something;
and `GET /api/events` as a server-sent event stream whose event name is the
envelope's `kind`. The web surface has not been started, so none of that is
running yet. The contract and both SDKs exist ahead of it deliberately: the
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
