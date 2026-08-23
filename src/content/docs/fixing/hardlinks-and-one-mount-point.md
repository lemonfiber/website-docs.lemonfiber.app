---
title: Hardlinks and one mount point
description: The filesystem contract every import depends on, which filesystems cannot keep it, and what it costs when it breaks.
sidebar:
  order: 5
---

Everything downstream of a finished download rests on one property: your downloads and your library share a filesystem, so importing a file **links** it rather than copying it.

When that breaks, nothing announces it. Imports still succeed. The library still fills. The only symptoms are a disk consuming twice what it should, and torrents that cannot seed from the library copy — both of which you discover late, usually when the disk is full.

```sh
$ lemonfiber doctor --only storage
```

## What a copy costs you

This is the sentence lemonfiber uses wherever it has to report the loss, because "hardlinks unsupported" means nothing on its own:

> Imports will copy instead of link. Each takes minutes rather than being instant, uses twice the disk while it runs, and torrents cannot seed from the library copy.

Three separate costs. The time is annoying. The disk is expensive. The seeding one is the one that gets people banned from private trackers, because the file you would seed from and the file in your library are now two different files, and keeping both means keeping two copies for ever.

## The capability is tested, never assumed

The filesystem's _type_ is only a hint. The check creates a file under the data location, hardlinks it, inspects both names, and confirms they resolve to one underlying file. Then it cleans up after itself.

That distinction matters because the exceptions are common rather than exotic.

| Filesystem        | What lemonfiber will tell you                                      |
| ----------------- | ------------------------------------------------------------------ |
| exFAT             | exFAT cannot create hardlinks                                      |
| FAT, FAT32, vFAT  | FAT filesystems cannot create hardlinks                            |
| SMB or CIFS       | Hardlinks are not usable across an SMB or CIFS share               |
| NFS               | Hardlinks are not usable across an NFS share                       |
| The WSL2 boundary | Hardlinks do not cross the WSL2 boundary to the Windows filesystem |

Anything else — ext4, XFS, Btrfs, ZFS, APFS, HFS+, NTFS and the overlay filesystems — normally links. If one of those fails the test, the fault is reported plainly rather than blamed on the filesystem's name, because the name would be explaining nothing.

A link that is made but cannot be confirmed to point at one file reports `unverified`. It is not disproven, but an unproven guarantee is never reported as met.

## The mode that follows

The mode is derived from what the test established, not chosen from a menu. You pick a location; lemonfiber works out what that location can do.

| Mode       | What it means                                                                         |
| ---------- | ------------------------------------------------------------------------------------- |
| `local`    | Imports hardlink instantly                                                            |
| `external` | Hardlinks work, on removable media, so availability is watched too                    |
| `copy`     | This location cannot hardlink; imports copy, and the services are configured to match |
| `nas`      | Imports copy across a network share                                                   |
| `degraded` | It used to link, and no longer does                                                   |

`degraded` is the loud one, and it is its own finding rather than the ordinary copy-mode warning. A location that never could link is a decision you made. A location that used to link and stopped is something that changed under a running stack, and every import since has quietly been copying.

That is [`STORAGE-5`](/fixing/every-error-by-code/#storage--the-data-location). The usual cause is a drive that came back mounted with different options — a network share remounted without the right ones, most often. Remount it as it was, then run the storage check again.

## One mount point, not two

Every container gets **one** data mount, with subdirectories beneath it. Splitting downloads and media into separate mounts is the anti-pattern this rule exists to prevent: separate mounts are separate filesystems, so nothing can ever link between them, and every import copies for ever.

This is rejected at manifest validation rather than left to be discovered in production. A stack that describes it raises [`STACK-6`](/fixing/every-error-by-code/#stack--the-stack-description) and names every fault it found in one pass.

The reasoning is recorded in [ADR-0006, a single data mount](/spec/00-overview/decisions/0006-single-data-mount/). [The stack manifest](/advanced/the-stack-manifest/) covers how mounts are declared.

## Permissions

Files the services cannot write produce failures a long way from their cause: the import fails inside the service, and what you see is a queue that stops emptying.

Two findings cover it.

- [`STORAGE-2`](/fixing/every-error-by-code/#storage--the-data-location) — the data location exists and cannot be written to at all.
- [`STORAGE-6`](/fixing/every-error-by-code/#storage--the-data-location) — you own it, and the containers cannot write it. They run as a particular user and group, and the message names both those and the directory's own ownership and mode. Give the service user ownership, or write access.

The check applies the platform's real semantics: ownership matters on native Linux, and is largely mapped away on Docker Desktop, where the check reports `skipped` with the reason rather than inventing a verdict.

## Availability

External drives get unplugged, and network mounts drop. A data location that vanishes while the services are running is dangerous: the library services may write into the now-empty mount point and build a phantom library on the system disk.

[`STORAGE-3`](/fixing/every-error-by-code/#storage--the-data-location) reports the location being unreachable. To have the stack stopped rather than left writing into nothing, run a watch over the forms that need it:

```sh
$ lemonfiber watch tv
```

A watch can only guard a location that is present when it starts — [`WATCH-2`](/fixing/every-error-by-code/#watch--guarding-the-data-location) is what you get if it has already gone.

## Space

Free space on its own is not enough to know. What matters is free space measured against what is already queued, because a disk that fills partway through an import leaves a partial file behind and stalls everything behind it.

[`STORAGE-4`](/fixing/every-error-by-code/#storage--the-data-location) covers both readings: low free space, and projected exhaustion against downloads still to land. Either way the options are the same — free space, thin the queue, or move the data location to a larger volume.

[`QUAL-1`](/fixing/every-error-by-code/#qual--quality-against-what-is-available) is the related warning from the other direction: the disk is not full, but at the quality preset you chose it holds only a few hours of content. Nothing is broken and nothing already downloaded is affected; new acquisitions will simply fill it quickly. [Quality presets](/running/quality-presets/) covers choosing a lighter one for media that does not need it.

## If you cannot have hardlinks

Sometimes the answer is that this location is what you have. Copy mode is supported rather than merely tolerated: the services are configured to copy, so imports still work, and lemonfiber reports the mode rather than nagging about it.

What you should know before settling for it is the third cost — you cannot seed from the library copy. If you are on private trackers, that is the one to weigh.

## Related

- [Every error by code](/fixing/every-error-by-code/) — the six `STORAGE` codes, side by side
- [Run the doctor](/fixing/run-the-doctor/) — running just the storage category
- [Your first stack](/start/your-first-stack/) — choosing a data location in the first place
- [C5, storage and hardlink management](/spec/10-functional/features/c-trust/c5-storage/) — the requirement this is written against
