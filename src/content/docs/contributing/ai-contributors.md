---
title: Working with AI agents
description: The project's policy for AI-assisted contribution — five rules, no disclosure, and the same standards as everything else.
sidebar: { order: 5 }
---

You may use an AI agent to write contributions here. The rules below bind the
agent and the person directing it equally, and none of them are lenient because
a machine was involved.

Every repository carries an `AGENTS.md` — the tool-agnostic file that Cursor,
Codex, Aider, Claude Code and others all read — and each one points at the
single canonical policy rather than restating it, so the rules cannot drift
between repositories or favour one tool.

## There is nothing to disclose

An AI is a tool, like an editor, a linter or a search engine, and this project
does not ask which of those you used either. A pull request is judged on whether
it satisfies the requirement it cites, passes the gates, and is code somebody
can maintain. None of those is a fact about what produced it.

A disclosure rule would imply the code needs a different kind of scrutiny
because of where it came from, which is the wrong thing to say about the
scrutiny everything else already gets. It would also be unenforceable — obeyed
by the careful, ignored by everyone else, and leaving reviewers a field they
cannot trust in either direction.

## The five rules

### 1. The spec is canonical — cite it

Every change references an identifier that already exists on the specification's
default branch. If the change alters behaviour, the spec change merges first.

An agent must not invent a plausible-looking identifier to satisfy the check. If
no requirement fits, the specification has a gap: open a spec pull request
describing what should happen, then implement against it. See
[cite the spec](/contributing/cite-the-spec/).

### 2. Identifiers never appear in code comments

A requirement identifier, an ADR number or a phase reference in a comment is
provenance, and provenance rots the moment the thing it names is superseded.
Citations belong in commit trailers and pull request bodies; code links to its
repository's `.docs/` pages, and those pages cite the spec.

An agent must never be instructed to write an identifier into a comment, and
must refuse if asked.

### 3. Comments explain why, never what

The [comment policy](/spec/40-quality/code-comments/) is strict and mechanically
enforced: no lone one-line comments, no narration of what the next line does, no
`TODO`. An informative comment is a two-to-four line block capturing a
non-obvious reason.

**Over-commenting is a defect, not thoroughness** — and it is the single most
common failure of machine-written code. Write code that reads for itself, and
reserve comments for a _why_ the code cannot carry.

### 4. Production-ready always

Shipped code is finished. No deferral notes, no "come back to this", no stubs
left behind, no suppressed lints. If work remains, it is not done. An agent that
cannot complete something says so plainly rather than leaving a marker in the
source. The bar is [the definition of done](/spec/40-quality/definition-of-done/).

### 5. No AI attribution in commits

Commits carry no co-authorship trailer and no reference to the tool that
produced them. The work is attributed to its author; how it was written is not
recorded in the history. This follows from there being nothing to disclose
rather than qualifying it — if provenance is not a property of the change, it
does not belong in the log.

## What an agent should read first

In order, for any repository:

1. That repository's `AGENTS.md` — what it is, and its one load-bearing
   property.
2. Its section under [the per-repo specifications](/spec/30-repos/), plus
   whatever feature and architecture sections it implements.
3. [The canonical AI policy](/spec/50-governance/ai-contributors/) and
   [the contributor guide](/spec/50-governance/contributing/).

Do not start editing before the cited requirement has been identified. The
specification is large, and the right move is to find the requirement the change
serves and work backwards from it.

## House style, briefly

- Match the surrounding code; new code should be indistinguishable from what is
  already there.
- Prefer the type system over runtime checks — an invariant in a type cannot be
  violated.
- No premature abstraction. A trait with one implementation is usually a
  function.
- Tables over prose in documentation. Each page states its intent in one line,
  then the substance.

## Related

- [Working with AI agents](/spec/50-governance/ai-contributors/) — the normative version of this page
- [The gates](/develop/the-gates/) — what a pull request has to pass, whoever wrote it
- [Code comments](/spec/40-quality/code-comments/) · [Code standards](/spec/40-quality/code-standards/)
