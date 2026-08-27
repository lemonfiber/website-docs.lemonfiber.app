---
title: Install lemonfiber
description: What the machine needs first, which platforms the release build targets, and the routes that get you the binary.
sidebar: { order: 2 }
---

lemonfiber is a single binary. Getting it onto the machine is the easy part; the
things it needs to find there are worth checking first.

## What the machine needs

**Docker, with Compose.** lemonfiber drives `docker compose` underneath. It does
not install Docker for you. Setup runs a preflight before it asks you anything
and tells the two failures apart: Docker not installed, and Docker installed but
its daemon not running. The remedies are entirely different, so the messages are
too.

**One mount point for downloads and media.** Both live under a single directory —
the data root — which is bind-mounted into every container. They must share one
filesystem, because that is what lets an import hardlink instead of copy. Setup
tests this empirically: it creates a link in the location you chose and inspects
it, rather than guessing from the filesystem's name. If the location cannot
hardlink, you are told the consequence in concrete terms and offered somewhere
else. See [Hardlinks and one mount point](/fixing/hardlinks-and-one-mount-point/).

On Windows this is the one rule that bites: the data root must live inside the
WSL2 filesystem, not on a Windows path, because hardlinks do not work correctly
across that boundary.

**Third-party accounts, if you want to download anything.** A Usenet provider and
a Usenet indexer, or a torrent indexer and a VPN, or both. lemonfiber walks you
through what each one is and roughly what it costs, and validates every
credential against the live service before storing it.

You can also run nothing but the library: point lemonfiber at a folder of media
you already have and serve it, with no accounts and no spend. That is a supported
end state rather than a degraded one — see
[Prerequisites and account guidance](/spec/10-functional/features/a-getting-started/a1-prerequisites/).

## Which platforms are built

The release build targets macOS on Apple silicon, macOS on Intel, and Linux on
x86_64 in both glibc and musl flavours.

Windows is not built yet. The native binary does not currently compile there, and
that is tracked as release-engineering work before 1.0. You can still run the
stack on Windows through Docker Desktop, but not the `lemonfiber` binary itself.

## Getting the binary

Three routes get you a binary. The fourth, Homebrew, is a placeholder, and it is
better to say so than to give you a command that fails.

| Route                                               | What it gets you                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| One-line shell installer                            | `lemonfiber-installer.sh`, attached to every release. It puts the binary in your Cargo home.                          |
| Prebuilt archive                                    | A `.tar.xz` per platform, each with a `.sha256` beside it and a `sha256.sum` over the set.                            |
| Building from source                                | The route for a change you are making yourself.                                                                       |
| Homebrew — `brew install lemonfiber/tap/lemonfiber` | Nothing. The tap repository exists, but the formula in it is a placeholder: the job that writes it turns on at 1.0.0. |

### The shell installer

Every release is a **pre-release**, so `releases/latest/` does not resolve. Name
the tag you want — the newest is on the
[releases page](https://github.com/lemonfiber/lemonfiber/releases):

```sh
$ curl --proto '=https' --tlsv1.2 -LsSf \
    https://github.com/lemonfiber/lemonfiber/releases/download/v0.8.0/lemonfiber-installer.sh | sh
```

The archives sit beside it on the same release, if you would rather check a
checksum and unpack one yourself.

### Building from source

You need a Rust toolchain, 1.82 or newer.

The stack manifest ships as a submodule and is read at build time, so the clone
has to include it:

```sh
$ git clone --recurse-submodules https://github.com/lemonfiber/lemonfiber.git
$ cd lemonfiber
$ cargo build --release --workspace
```

That leaves the binary at `target/release/lemonfiber`. Put it somewhere on your
`PATH`, or run it from there.

If you have already cloned without `--recurse-submodules`, run
`git submodule update --init` before building.

## Check it worked

```sh
$ lemonfiber version
```

That reports the version of the binary and the version of the stack it carries.
Both matter in a bug report, because a lemonfiber release pins a particular stack
and a particular set of service image tags.

## What happens next

Run `lemonfiber` with nothing configured and it offers to set itself up. Nothing
is written to disk until you have seen a complete summary and confirmed it.

That is the subject of [Your first stack](/start/your-first-stack/).

## If the install itself goes wrong

Docker problems, permission problems and data-location problems all surface
before anything is written, and each names its own remedy. If you are stuck,
[run the doctor](/fixing/run-the-doctor/) — it checks the same things setup does
and reports what it found. Every error lemonfiber emits carries a code, and
[Every error by code](/fixing/every-error-by-code/) explains them.
