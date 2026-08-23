---
title: Every payload kind
description: The six payload kinds the contract artefact describes, and every field each one carries.
sidebar:
  order: 2
---

`kind` says which payload an [envelope](/api/the-envelope/) carries, so a
consumer can branch before parsing `data`. The contract artefact describes six of
them, and each entry is the whole envelope with that kind's payload in place
rather than the payload alone — a generator wants the shape it will actually
parse.

| Kind          | `data` carries       | In one line                                                   |
| ------------- | -------------------- | ------------------------------------------------------------- |
| `error`       | A problem            | A command could not do what was asked                         |
| `log`         | A log line           | One line of one service's output                              |
| `setup`       | A setup report       | What a setup run came to, and what it settled on              |
| `walkthrough` | A walkthrough report | What a first-content walk did, narrated line by line          |
| `watch`       | A supervision report | What a watch saw, once the data root it was guarding was lost |
| `word`        | A glossary term      | One word this product uses, and what it means                 |

Everything below is generated from the types that serialise the reply, so a field
here is a field on the wire.

## `error`

Something that went wrong, in the form an operator can act on. This is the kind a
failed run emits on the error stream.

| Field      | Type            | Required | What it is                                                     |
| ---------- | --------------- | -------- | -------------------------------------------------------------- |
| `code`     | string          | yes      | The stable identifier for this kind of problem                 |
| `severity` | enum            | yes      | How much it matters                                            |
| `state`    | enum            | yes      | Where it stands with respect to being fixed                    |
| `summary`  | string          | yes      | What happened, in one plain sentence                           |
| `meaning`  | string          | yes      | What it means for the operator                                 |
| `remedies` | array           | yes      | What to do, most likely first                                  |
| `detail`   | string or null  | no       | The underlying technical detail, available but never leading   |
| `cause`    | problem or null | no       | The problem that produced this one, where several share a root |

`cause` is a problem of the same shape, so a symptom can name the root it came
from without a second type existing to say so.

A code is stable on purpose: an operator who searches for one should find the
same answer a year later. Codes are declared beside the code that raises them and
are never recycled.

### `remedies[]`

| Field    | Type           | Required | What it is                                                           |
| -------- | -------------- | -------- | -------------------------------------------------------------------- |
| `action` | string         | yes      | The action, phrased as something to do rather than something to know |
| `detail` | string or null | no       | Where to look, when that helps                                       |

### `severity`

Four levels, deliberately. More would not be applied consistently, and
inconsistent severity is worse than coarse severity.

| Value      | Meaning                                           |
| ---------- | ------------------------------------------------- |
| `advisory` | Informational; nothing is required                |
| `warning`  | Degraded or risky, still working                  |
| `error`    | Something is broken                               |
| `critical` | Consequences outside the machine, or data at risk |

### `state`

| Value        | Meaning                                        |
| ------------ | ---------------------------------------------- |
| `actionable` | A remedy is available here                     |
| `guided`     | The operator must act, somewhere else          |
| `remediable` | lemonfiber can fix this itself                 |
| `unknown`    | No known remedy; escalation is offered instead |
| `suppressed` | Acknowledged, and not re-shown until it recurs |

## `log`

One line of output from one service. A log stream emits one envelope of this kind
per line.

| Field     | Type           | Required | What it is                                                         |
| --------- | -------------- | -------- | ------------------------------------------------------------------ |
| `service` | string         | yes      | The Compose service it came from                                   |
| `stream`  | enum           | yes      | `stdout` or `stderr`                                               |
| `line`    | string         | yes      | The line, without its trailing newline                             |
| `at`      | string or null | no       | When the container itself says it wrote the line, where it said so |

`at` is kept verbatim and unparsed. Containers disagree with the host clock and
with each other, and the only defensible ordering is each container's own account
of itself — which a reader can apply only if it is carried rather than replaced
by an arrival time.

## `setup`

What a setup run came to, and what it settled on.

| Field          | Type           | Required | What it is                                                    |
| -------------- | -------------- | -------- | ------------------------------------------------------------- |
| `outcome`      | enum           | yes      | How the run ended                                             |
| `protocols`    | object         | yes      | Which ways of downloading the stack was set up for            |
| `data_root`    | string or null | no       | Where the library was put, where a location was chosen        |
| `service_user` | string or null | no       | The user the services run as, as `uid:gid`, where one was set |

| `outcome`        | Meaning                                                    |
| ---------------- | ---------------------------------------------------------- |
| `applied`        | The reviewed answers were written                          |
| `abandoned`      | The plan was seen and not applied; nothing was written     |
| `already-set-up` | Nothing was asked, because this machine was already set up |

### `protocols`

| Field     | Type    | Required | What it is                              |
| --------- | ------- | -------- | --------------------------------------- |
| `usenet`  | boolean | yes      | A Usenet provider is configured         |
| `torrent` | boolean | yes      | A VPN and torrent client are configured |

This report is deliberately **not** the settings themselves. Setup writes an
indexer key and a service password among them, and a report a script can read is
a report a script can log — into a file, a CI transcript, somebody's terminal
history. So it says what was decided and never what was entered, and its fields
are chosen one at a time rather than by serialising a struct that might later
gain a secret.

## `walkthrough`

What a first-content walkthrough did: the whole of it, narrated line by line as
it happened.

| Field           | Type            | Required | What it is                                                                 |
| --------------- | --------------- | -------- | -------------------------------------------------------------------------- |
| `shape`         | enum            | yes      | Which walk this was                                                        |
| `state`         | enum            | yes      | Where it ended up                                                          |
| `proves`        | string          | yes      | What it set out to prove, said so the operator knows what they watched     |
| `lines`         | array           | yes      | Every line it said, in order                                               |
| `suggestions`   | array of string | yes      | What could have been walked instead, where nothing was chosen              |
| `in_background` | boolean         | yes      | Whether the download was handed to the background rather than waited out   |
| `already_here`  | boolean         | yes      | Whether what was asked for was already here, and so was not acquired again |
| `item`          | string or null  | no       | What it walked, where it got as far as choosing something                  |
| `link`          | enum or null    | no       | What the import did with the file, where it got that far                   |
| `stopped`       | object or null  | no       | Where and why it stopped, where it did                                     |
| `handover`      | object or null  | no       | Where it leaves the operator, where it worked                              |

| `shape`        | Meaning                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pipeline`     | The full walk: search, grab, download, import, and see it in the library                                           |
| `library-only` | The walk for a stack that acquires nothing: point at media already on disk and confirm the media server can see it |

| `state`       | Meaning                                                            |
| ------------- | ------------------------------------------------------------------ |
| `offered`     | Presented at the end of setup, not yet answered                    |
| `skipped`     | Declined, and available later, carrying no penalty                 |
| `searching`   | Looking for releases                                               |
| `grabbing`    | Sending a release to the download client                           |
| `downloading` | The download is running                                            |
| `importing`   | Moving the finished download into the library                      |
| `complete`    | It is in the library and playable                                  |
| `failed`      | Stopped at a named step, with a diagnosis                          |
| `abandoned`   | The operator left part-way; whatever was in flight stays in flight |

| `link`       | Meaning                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `hardlinked` | The library entry and the download are the same file under two names, which costs no extra disk |
| `copied`     | The file was copied, so it exists twice. Works, but every import costs its own size again       |

### `lines[]`

| Field    | Type   | Required | What it is                                                                    |
| -------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `step`   | enum   | yes      | The step being narrated                                                       |
| `said`   | string | yes      | What it is doing, in plain language                                           |
| `detail` | string | yes      | What was specifically true, or empty where there is nothing particular to say |

### `step`

One step of the walk, ordered from picking something to watching it play.

| Value         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| `choosing`    | Picking something to add, and confirming it is not already here      |
| `searching`   | The indexers are being searched for releases                         |
| `grabbing`    | A release is being sent to the download client                       |
| `downloading` | The download is running                                              |
| `importing`   | The library manager is moving the finished download into the library |
| `scanning`    | The media server is being told to look at what arrived               |
| `available`   | It is in the library and playable                                    |

### `stopped`

| Field    | Type            | Required | What it is                                         |
| -------- | --------------- | -------- | -------------------------------------------------- |
| `step`   | enum            | yes      | The step it stopped at                             |
| `reason` | enum            | yes      | Why                                                |
| `logs`   | array of string | yes      | What the services involved were saying at the time |
| `remedy` | string          | yes      | The one thing to try                               |

| `reason`              | Meaning                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `no-indexers`         | No indexer is configured, so there is nothing to search                                       |
| `indexers-failed`     | The search could not be run: the indexers, or the service holding them, would not answer      |
| `nothing-matched`     | The search ran cleanly and matched nothing — an entirely different problem from the one above |
| `none-met-the-preset` | Releases exist, but none meets the chosen quality preset                                      |
| `tunnel-down`         | Torrents are in play and the tunnel is not verified up. Nothing is grabbed                    |
| `not-grabbed`         | The release was never handed to a download client                                             |
| `stalled`             | The download stopped making progress                                                          |
| `import-failed`       | The download finished and the library manager would not take it                               |
| `no-media-server`     | There is no media server in the running form to make it playable                              |
| `not-visible`         | It was imported, the media server was told, and it still cannot be found there                |

### `handover`

| Field  | Type          | Required | What it is                |
| ------ | ------------- | -------- | ------------------------- |
| `next` | array of enum | yes      | What to do next, in order |

| `next`         | Meaning                                                    |
| -------------- | ---------------------------------------------------------- |
| `more-content` | Add more content, now that the shape of it is understood   |
| `household`    | Let the rest of the household ask for things themselves    |
| `client-apps`  | Watch it somewhere other than the machine it is running on |

## `watch`

What a watch saw, once the data root it was guarding was lost.

| Field     | Type            | Required | What it is                                                                        |
| --------- | --------------- | -------- | --------------------------------------------------------------------------------- |
| `forms`   | array of string | yes      | The forms that were being watched, and are now stopped                            |
| `reason`  | string          | yes      | Why the watch ended: the data root vanished, or a different volume took its place |
| `stopped` | boolean         | yes      | Whether stopping the services succeeded                                           |

## `word`

A word this product uses, and what somebody meeting it needs to know.

| Field         | Type            | Required | What it is                                                 |
| ------------- | --------------- | -------- | ---------------------------------------------------------- |
| `word`        | string          | yes      | The word as it appears in the interface                    |
| `short`       | string          | yes      | One sentence: what it is for, and what it costs or gains   |
| `also_called` | array of string | yes      | What other services in this stack call the same thing      |
| `deep`        | string or null  | no       | More, for somebody who asks — never needed in order to act |

`short` is enough to act on: somebody who reads only that should not be stuck.
`also_called` exists because the services do not agree on words, and an operator
moving between their screens should not have to work out that two of them are
one.

## Kinds the artefact does not describe yet

The command line emits further kinds under `--json` — among them `version`,
`forms`, `preview`, `lifecycle`, `config`, `quality`, `upgrade`, `music`, `trace`,
`household`, `stuck`, `status`, `doctor`, `seed` and `reset`. Their shapes are
not in the contract artefact, so no SDK has generated types for them and they
should not be treated as fixed. The six above are the ones the contract carries.

## Where to go next

The wrapper these sit inside is [the envelope](/api/the-envelope/). To read them
from code without transcribing any of the above, use
[the TypeScript SDK](/api/typescript-sdk/) or [the PHP SDK](/api/php-sdk/), both
of which generate one type per kind. Error codes have their own reference in
[every error by code](/fixing/every-error-by-code/).
