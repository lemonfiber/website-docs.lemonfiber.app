---
title: Every error by code
description: Every family of error code lemonfiber raises, each with a page of what its codes mean and what to do about them, read from lemonfiber's registry of codes at the revision this site pins.
sidebar:
  order: 2
---

When lemonfiber refuses to do something, it says so in four parts: a **code**, a **summary** of what happened, what it **means** for you, and at least one **remedy** — something to do. The code is the stable part. It is one token, it is never recycled, and it is the thing to search for.

A code looks like `VPN-1`: a family, then a number. The family says which part of the stack raised it. The number identifies the problem within that family. Each family has a page of its own, and the [families](#the-families) below link every one.

There is no code on those pages that lemonfiber cannot raise, and no code it can raise that is missing from them — checked against the revision of lemonfiber this site renders, which is named on the [changelog](/project/changelog/). A code added to lemonfiber after that revision appears on its family's page when the revision moves.

## How to read a row

Each table gives the code, what it means when you see it, and what the tool itself offers as the way forward. Where a message includes a name — a service, a path, a port — the tables describe the shape rather than quoting a template.

Two things are worth knowing before you start:

- **A problem always states what was and was not changed.** Most refusals happen before anything is written. Where something was written, the message says so.
- **A problem with no known remedy escalates rather than guesses.** Two codes in this reference do that: they ask you for a [support bundle](/fixing/the-support-bundle/) rather than offer advice that might be wrong.

## The families

Each family's page sets out all of its codes in one table. Search this site for a code to land on its family's page directly.

| Family                                                                                                | What it covers                               |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| <span id="setup--the-first-run"></span>[`SETUP`](/fixing/codes/setup/)                                | The first run                                |
| <span id="config--your-settings"></span>[`CONFIG`](/fixing/codes/config/)                             | Your settings                                |
| <span id="stack--the-stack-description"></span>[`STACK`](/fixing/codes/stack/)                        | The stack description                        |
| <span id="form--choosing-what-to-run"></span>[`FORM`](/fixing/codes/form/)                            | Choosing what to run                         |
| <span id="env--the-container-engine"></span>[`ENV`](/fixing/codes/env/)                               | The container engine                         |
| <span id="docker--talking-to-the-engine"></span>[`DOCKER`](/fixing/codes/docker/)                     | Talking to the engine                        |
| <span id="proc--the-program-underneath"></span>[`PROC`](/fixing/codes/proc/)                          | The program underneath                       |
| <span id="life--starting-and-stopping"></span>[`LIFE`](/fixing/codes/life/)                           | Starting and stopping                        |
| <span id="storage--the-data-location"></span>[`STORAGE`](/fixing/codes/storage/)                      | The data location                            |
| <span id="qual--quality-against-what-is-available"></span>[`QUAL`](/fixing/codes/qual/)               | Quality against what is available            |
| <span id="vpn--traffic-leaving-the-tunnel"></span>[`VPN`](/fixing/codes/vpn/)                         | Traffic leaving the tunnel                   |
| <span id="bind--where-the-stack-is-actually-listening"></span>[`BIND`](/fixing/codes/bind/)           | Where the stack is actually listening        |
| <span id="cred--credentials-a-service-refuses"></span>[`CRED`](/fixing/codes/cred/)                   | Credentials a service refuses                |
| <span id="provider--accounts-and-indexers"></span>[`PROVIDER`](/fixing/codes/provider/)               | Accounts and indexers                        |
| <span id="wiring--drift-between-services"></span>[`WIRING`](/fixing/codes/wiring/)                    | Drift between services                       |
| <span id="seed--wiring-the-services-together"></span>[`SEED`](/fixing/codes/seed/)                    | Wiring the services together                 |
| <span id="backup--capturing-your-configuration"></span>[`BACKUP`](/fixing/codes/backup/)              | Capturing your configuration                 |
| <span id="restore--putting-configuration-back"></span>[`RESTORE`](/fixing/codes/restore/)             | Putting configuration back                   |
| <span id="undo--putting-a-run-back"></span>[`UNDO`](/fixing/codes/undo/)                              | Putting a run back                           |
| <span id="update--moving-the-stack-onto-newer-versions"></span>[`UPDATE`](/fixing/codes/update/)      | Moving the stack onto newer versions         |
| <span id="bundle--the-support-bundle"></span>[`BUNDLE`](/fixing/codes/bundle/)                        | The support bundle                           |
| <span id="kept--what-lemonfiber-keeps-here"></span>[`KEPT`](/fixing/codes/kept/)                      | What lemonfiber keeps here                   |
| <span id="watch--guarding-the-data-location"></span>[`WATCH`](/fixing/codes/watch/)                   | Guarding the data location                   |
| <span id="diag--narrowing-a-diagnosis"></span>[`DIAG`](/fixing/codes/diag/)                           | Narrowing a diagnosis                        |
| <span id="repair--putting-right-what-the-doctor-found"></span>[`REPAIR`](/fixing/codes/repair/)       | Putting right what the doctor found          |
| <span id="ack--answering-a-warning"></span>[`ACK`](/fixing/codes/ack/)                                | Answering a warning                          |
| <span id="word--the-glossary"></span>[`WORD`](/fixing/codes/word/)                                    | The glossary                                 |
| <span id="serve--the-web-surface"></span>[`SERVE`](/fixing/codes/serve/)                              | The web surface                              |
| <span id="admit--who-the-web-interface-lets-in"></span>[`ADMIT`](/fixing/codes/admit/)                | Who the web interface lets in                |
| <span id="read--asking-the-web-surface-a-question"></span>[`READ`](/fixing/codes/read/)               | Asking the web surface a question            |
| <span id="ask--putting-a-request-to-the-web-surface"></span>[`ASK`](/fixing/codes/ask/)               | Putting a request to the web surface         |
| <span id="pair--pairing-a-phone-with-the-stack"></span>[`PAIR`](/fixing/codes/pair/)                  | Pairing a phone with the stack               |
| <span id="tui--the-terminal-interface"></span>[`TUI`](/fixing/codes/tui/)                             | The terminal interface                       |
| <span id="invite--offering-somebody-an-account"></span>[`INVITE`](/fixing/codes/invite/)              | Offering somebody an account                 |
| <span id="handoff--pointing-somebodys-device-at-the-stack"></span>[`HANDOFF`](/fixing/codes/handoff/) | Pointing somebody's device at the stack      |
| <span id="reissue--letting-somebody-set-a-new-password"></span>[`REISSUE`](/fixing/codes/reissue/)    | Letting somebody set a new password          |
| <span id="remove--taking-somebody-out-of-the-household"></span>[`REMOVE`](/fixing/codes/remove/)      | Taking somebody out of the household         |
| <span id="quota--what-the-household-may-ask-for"></span>[`QUOTA`](/fixing/codes/quota/)               | What the household may ask for               |
| <span id="telling--what-the-household-is-told-about"></span>[`TELLING`](/fixing/codes/telling/)       | What the household is told about             |
| <span id="space--the-disk-and-letting-a-download-go"></span>[`SPACE`](/fixing/codes/space/)           | The disk, and letting a download go          |
| <span id="rate--holding-the-stack-to-a-share-of-the-line"></span>[`RATE`](/fixing/codes/rate/)        | Holding the stack to a share of the line     |
| <span id="host--keeping-a-command-running-without-a-terminal"></span>[`HOST`](/fixing/codes/host/)    | Keeping a command running without a terminal |
| <span id="gone--taking-lemonfiber-off-this-machine"></span>[`GONE`](/fixing/codes/gone/)              | Taking lemonfiber off this machine           |
| <span id="rehearse--asking-what-a-command-would-do"></span>[`REHEARSE`](/fixing/codes/rehearse/)      | Asking what a command would do               |
| <span id="wire--choosing-what-fills-a-capability"></span>[`WIRE`](/fixing/codes/wire/)                | Choosing what fills a capability             |
| <span id="plugin--installing-and-running-plugins"></span>[`PLUGIN`](/fixing/codes/plugin/)            | Installing and running plugins               |

## Severity

Every problem carries one of four levels. There are four deliberately: more would not be applied consistently, and inconsistent severity is worse than coarse severity.

| Severity   | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `advisory` | Informational. Nothing is required.                |
| `warning`  | Degraded or risky, and still working.              |
| `error`    | Something is broken.                               |
| `critical` | Consequences outside the machine, or data at risk. |

Only five codes are raised as `critical`: `VPN-1`, `RESTORE-4`, `BUNDLE-1`, `STACK-3` and `SPACE-1`. Three of them are about something leaving your machine that should not; the other two are about work that would be lost.

Severities are ordered, so a health summary can report the worst of what it found without a comparison table.

## State

Alongside severity, a problem says where it stands with respect to being fixed.

| State        | Meaning                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| `actionable` | A remedy is available here, and you can act on it.                              |
| `guided`     | You must act, somewhere else — in a service's own interface, or on the machine. |
| `remediable` | lemonfiber can fix this itself. `lemonfiber doctor --fix` offers it.            |
| `unknown`    | No known remedy. Escalation to a support bundle is offered instead.             |
| `suppressed` | Acknowledged with `--accept`, and not led with again until it recurs.           |

`unknown` is the honest answer rather than the absent one. Admitting ignorance costs you a support bundle; confident wrong guidance costs you an afternoon.

## Exit codes

A script needs to know whether to fix its own input, start Docker, or wait longer, and one code for all three tells it nothing. Every run leaves with one of these.

| Exit code | Name          | Meaning                                                           |
| --------- | ------------- | ----------------------------------------------------------------- |
| `0`       | success       | The thing asked for was done, or the question asked was answered. |
| `1`       | failure       | A general failure.                                                |
| `2`       | usage         | A flag or argument you gave could not be understood.              |
| `3`       | preflight     | Something outside lemonfiber has to be fixed before it can act.   |
| `4`       | never settled | Something started, and a service never became usable.             |
| `5`       | validation    | Something you wrote was refused.                                  |

Codes map onto exits deliberately:

- `LIFE-1` exits `4`.
- `PROC-1` and `DOCKER-1` exit `3` — the engine is not lemonfiber's to fix.
- `STACK-1`, `STACK-6`, `STACK-7`, `STACK-8` and `CONFIG-1` exit `5` — they are about what you wrote.
- Everything else exits `1`.

Some commands decide their exit from their result rather than from a problem:

- `lemonfiber doctor` exits `0` when the overall verdict is healthy or degraded, and `1` when it is broken or unknown. Reporting success when nothing could be verified is the falsehood the checks exist to avoid.
- `lemonfiber seed` exits `5` when a conflict you wrote blocks it, and `1` when work was merely skipped or failed and may complete on a re-run.
- `lemonfiber quality set`, `lemonfiber quality upgrade` and `lemonfiber reset` exit `5` when they are holding a change that needs your confirmation.
- `lemonfiber doctor --fix` exits non-zero when anything was left unmended.
- Queries — `trace`, `stuck`, `household`, `ps`, `version`, `forms`, `config` — always exit `0`. Asking is never a failure, whatever the answer.

## Where these come from

The codes on the family pages are read from lemonfiber's registry of codes, at the revision this site is pinned to. Every code is declared there once, beside the line saying what it means, and the code that raises it names it from there. A code nothing raises is not declared, and its number is never given to another — so a search that found an answer once finds the same answer later.

lemonfiber emits the whole list, and this site's own gate compares that list against the family pages in both directions on every change. So the sentence at the top of this page is checked rather than promised: a code added to lemonfiber and not to its family's page fails the build, and so does a code on a family page that nothing raises, a code on another family's page, and a family with no page or no row in the table above.

For the model behind them — why a problem cannot be constructed without a remedy, how a typed failure becomes something you read, and why the core never formats — see [the error model architecture note](/develop/architecture/error-model/). The requirement it is written against is [G4, the error and remedy model](/spec/10-functional/features/g-ux/g4-error-model/).
