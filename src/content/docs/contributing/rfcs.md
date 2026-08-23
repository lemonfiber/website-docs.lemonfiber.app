---
title: Proposing a change
description: The RFC flow — how an idea from outside the maintainers becomes a decided proposal and then a requirement.
sidebar: { order: 4 }
---

You do not need repository access, a branch, or any local tooling to propose a
change to what lemonfiber does. You need a GitHub issue.

The **RFC process** is [the change lifecycle](/spec/50-governance/change-lifecycle/)
opened to everyone: you describe the change on an issue, a maintainer decides
it there, and only then does anything appear in the specification.

## The issue is the source of truth

Until a proposal is approved **and** merged, the issue is authoritative. Not a
branch, not a document. The proposal lives on the issue, is discussed on the
issue, and is decided on the issue.

This is deliberate. A proposal that materialised in the repository before it was
decided would be indistinguishable from an accepted one, and being able to tell
those apart is the entire purpose of the `Draft` status.

## The four steps

### 1. Propose

Open an issue through the **RFC form** on the specification repository. It asks
for a structured proposal: the area it touches, a title, the problem, the
behaviour you want, and why. You do not have to write it as a requirement —
describe the problem and the outcome, and a maintainer shapes it from there.

### 2. Discuss

The proposal is refined in the open. Open `rfc` issues are surfaced publicly
alongside the specification's own `Draft` items, as one feed of what is under
consideration but not yet binding, so anyone can see and weigh in on what is
being thought about.

### 3. Decide

A **maintainer** marks the issue approved or declined. Only a maintainer can:
the automation checks that whoever applied the label has write access before it
acts on it, so the label is a real gate rather than a suggestion.

A declined proposal is closed, and no pull request is opened.

### 4. Harden

On approval, automation scaffolds a **Draft** requirement — at the next free
permanent identifier — and opens the specification pull request for you, linking
your issue. From there it is an ordinary spec review. Merging it turns the Draft
into `Accepted` and closes the issue.

At that point the requirement is citable, and the work can be implemented by
anyone, including you.

## What the automation will not do

The fields you type are written by anyone on the internet, and the automation
treats them that way. It reads them through environment variables rather than
interpolating them into a shell, validates the area and the derived filename
against fixed patterns before writing anything, and never executes their
contents. What it produces is a Draft stub that a maintainer reads before it can
merge.

## Statuses worth knowing

| Status         | What it means                                           |
| -------------- | ------------------------------------------------------- |
| **Draft**      | Proposed, not binding. Implementation must not cite it. |
| **Accepted**   | Binding, and citable.                                   |
| **Superseded** | Replaced, and linked to its replacement.                |
| **Withdrawn**  | Removed. Its number is retired permanently.             |

Draft requirements are deliberately not citable. If they were, anyone could
merge a draft and implement against it in the same breath, and the ordering
guarantee that keeps the specification ahead of the code would collapse.

## If it is a bug rather than an idea

A bug is behaviour that contradicts the specification, and it goes to the
implementation repository rather than through this process. See
[where does my issue go?](/contributing/where-does-my-issue-go/).

## Related

- [The RFC process](/spec/50-governance/rfc-process/) — the normative version of this page
- [Change lifecycle](/spec/50-governance/change-lifecycle/) — the review your proposal rejoins
- [Cite the spec](/contributing/cite-the-spec/) — implementing the requirement once it lands
- [Where to ask](/contributing/where-to-ask/) — if you would rather talk it through first
