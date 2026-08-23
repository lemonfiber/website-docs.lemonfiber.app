---
title: Sign-off and licensing
description: Why every commit needs a sign-off and a signature, and what licence your contribution ships under.
sidebar: { order: 2 }
---

Two things are required of every commit that reaches `main`, and they are not
the same thing. One says **who** you are. The other says you had the **right**
to contribute the work. A commit needs both.

## Sign your commits off

Commit with `-s`:

```
$ git commit -s -m "fix: stop reporting killswitch as passing when untested"
```

That adds a `Signed-off-by` trailer naming you:

```
Signed-off-by: Ada Lovelace <ada@example.com>
```

It is the [Developer Certificate of Origin
1.1](https://developercertificate.org/) — a short, well-understood assertion
that you wrote the work, or otherwise have the right to submit it under the
repository's licence. It is not a contract you sign, and there is no paperwork
behind it.

A `dco` check runs on every pull request and fails when any commit is missing a
valid sign-off matching its author. Merge commits and bot-authored commits are
exempt: GitHub authors those, so there is no human to attest.

## Sign your commits cryptographically

Separately, `main` requires **signed** commits — SSH or GPG. The signature
proves authorship; the sign-off asserts the right to contribute. Set it once:

```
$ git config commit.gpgsign true
```

With that set and `-s` in your habit, both obligations are handled and you can
stop thinking about them.

## Why a DCO and not a CLA

A contributor licence agreement asks you to assign or broadly relicense rights,
needs storage and tracking, and reliably deters casual contributors. The DCO
asserts the one thing that actually matters, in a single trailer. For a project
this size it is the right weight.

So: **no CLA, and no copyright assignment.** You keep your copyright.

## Inbound equals outbound

Your contribution is licensed under the **same licence as the repository it
lands in**. By opening a pull request you agree it is provided on those terms.

| What you are changing                                      | Licence                               |
| ---------------------------------------------------------- | ------------------------------------- |
| Code — the binary, the stack, the tap, the SDKs, the sites | Hippocratic License 3.0               |
| Prose — the specification and documentation                | CC BY-SA 4.0                          |
| The `brand` repository                                     | Split: tokens open, marks proprietary |

This is stated plainly rather than assumed, because the code licence is
**ethical source rather than OSI-approved**. You should know before you
contribute that your work will ship under the Hippocratic License, that it is
not recognised as open source by the OSI, and what that means in practice. The
consequences are set out honestly on
[the licence page](/project/licence/) and argued in full in
[the licence rationale](/spec/90-appendix/license-rationale/).

If that is a problem for you, it is better to find out now than after you have
written something.

## The marks are not yours to use

The name, the logo and the wordmark are proprietary, and that is deliberate —
it is the same arrangement Rust, Python, Mozilla and Docker use. Fork the code
freely; do not wear the name. Referring to lemonfiber by name is fine and needs
no permission. See [the forking policy](/spec/60-brand/trademark/).

## This does not replace the citation

Sign-off and citation are independent obligations. A pull request must **both**
cite a spec identifier and be signed off; neither substitutes for the other, and
each has its own check.

## Related

- [Cite the spec](/contributing/cite-the-spec/) — the other requirement on every change
- [The licence](/project/licence/) — what lemonfiber ships under, and what that costs
- [Sign-off and inbound licensing](/spec/50-governance/dco/) — the normative version of this page
- [The gates](/develop/the-gates/) — where the `dco` check sits among the rest
