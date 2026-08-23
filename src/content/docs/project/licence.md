---
title: The licence
description: Hippocratic 3.0 for the code, CC BY-SA 4.0 for the prose, proprietary marks — and an honest account of what that choice costs.
sidebar: { order: 2 }
---

lemonfiber is not licensed the way most software you install is. Read this
before you build on it, because the difference is real and some of it will
matter to you.

## What is licensed how

| What                                                                 | Licence                          |
| -------------------------------------------------------------------- | -------------------------------- |
| The binary, the stack, the tap, the SDKs, the web surface, the sites | Hippocratic License 3.0          |
| The specification and the documentation                              | CC BY-SA 4.0                     |
| The design tokens in `brand`                                         | Hippocratic License 3.0          |
| The logo and marks in `brand`                                        | Proprietary, all rights reserved |

The [Hippocratic License](https://firstdonoharm.dev/) is an _ethical source_
licence from the Organization for Ethical Source. It grants broad permissions
while prohibiting uses that violate human rights standards. It is modular; the
project ships the core terms unless a module is explicitly adopted.

## Why

The project's values are the reason, and there is not a more sophisticated one.
This is software for individuals running things on their own hardware, and the
licence is meant to state a position rather than maximise adoption. Restricting
harmful use is the point, not a side effect.

## What it costs

The Hippocratic License is **not OSI-approved** and is not recognised as open
source by the OSI, nor as free software by the FSF. That is not an oversight or
a pending application: the licence restricts fields of endeavour, which the Open
Source Definition forbids by design. The ethical-source position is that the
definition is wrong on this point — a coherent argument, but it means the "open
source" label does not apply here.

Stated plainly, so nobody discovers it later:

| Area                   | Consequence                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GitHub                 | The sidebar shows "Other". There is no recognised licence badge.                                                    |
| crates.io              | There is no SPDX identifier, so the manifest points at the licence file instead. Publishing still works.            |
| Distribution packaging | Debian, Fedora, nixpkgs and similar will not accept it into their repositories.                                     |
| `homebrew-core`        | Requires OSI-approved licences. The project's own tap is unaffected, which is why the tap exists.                   |
| Corporate use          | Many legal teams reject non-OSI licences automatically. For a self-hosted household tool, that is not the audience. |
| Contributors           | Some people will decline to contribute to a non-OSI-licensed project.                                               |
| Enforceability         | Largely untested in court. Its force is normative rather than legal.                                                |

None of these block the project. All of them are worth knowing before you depend
on it.

## What was not chosen

**AGPL-3.0-or-later** is the strongest OSI-approved approximation of the same
instinct — it cannot restrict who uses the software or for what, but it closes
the hosted-service loophole. It was rejected because the goal is to state an
ethical position directly rather than approximate it through reciprocity, and it
remains the obvious fallback if OSI approval ever becomes necessary.

**GPL-3.0** is a conventional fit for a desktop application but has weaker
reciprocity than AGPL and no ethical clause, so it loses on both axes.
**MIT and Apache-2.0** are the Rust ecosystem's defaults and the best choice for
adoption, and they permit exactly the unrestricted commercial use this choice
objects to. **SSPL, BUSL and Commons Clause** are also non-OSI, but motivated by
commercial moats rather than ethics — the worst of both.

## The marks are deliberately not open

The logo and wordmark are the one component that is not open in any form. This
is not a contradiction of the project's values; it is the standard arrangement
for an open project with a protected identity, and Rust, Mozilla, Python and
Docker all do the same. Anyone may use, fork and redistribute the code; nobody
may ship their fork under the original name and logo, because that would let a
fork impersonate the project.

That is also why `brand` is licensed in two parts. The **tokens** are open, so a
fork — or the web UI — can use the visual system. The **marks** stay
proprietary, so the identity cannot be lifted with it.

If you fork: rename it, bring your own logo, keep the licences and the
attribution, and say "based on lemonfiber" as a matter of fact. Referring to
lemonfiber by name needs no permission; using the name or mark as your own
project's identity does. The policy is
[trademark and forking](/spec/60-brand/trademark/).

## Contributions

Your contribution is licensed under the same licence as the repository it lands
in. There is no contributor licence agreement and no copyright assignment: you
keep your copyright, and you licence the work inbound on the terms the project
ships outbound. See [sign-off and licensing](/contributing/sign-off-and-licensing/).

## The services lemonfiber runs are not affected

Every service the stack orchestrates is OSI-licensed open source, and the
authoritative licence for each one is recorded against it in the stack manifest.
The stack distributes configuration that _references_ public container images;
it does not link against, embed or redistribute their code. **No copyleft
obligation propagates in either direction** — this licence choice has no effect
on theirs, and theirs has none on this one.

## Why the documentation is licensed separately

Creative Commons licences are unsuitable for software, and Creative Commons say
so themselves. But CC BY-SA is the right tool for prose, and its ShareAlike
clause is consistent with the reciprocity instinct behind the code licence.

## Related

- [Licence rationale](/spec/90-appendix/license-rationale/) — the full argument, including the per-service breakdown
- [Trademark and forking](/spec/60-brand/trademark/) — what you may and may not do with the name
- [Sign-off and licensing](/contributing/sign-off-and-licensing/) — the inbound terms for contributions
- [The colophon](/spec/90-appendix/colophon/) — everything this is built on, credited
