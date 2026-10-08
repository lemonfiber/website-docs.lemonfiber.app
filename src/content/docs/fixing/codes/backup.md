---
title: BACKUP — capturing your configuration
topic: use
description: Every BACKUP code lemonfiber raises, what it means, and what to do about it.
sidebar:
  hidden: true
---

Raised by `lemonfiber backup`. See [backup and restore](/running/backup-and-restore/).

| Code       | What it means                                                                                                                                                                                                                                          | What to do                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `BACKUP-1` | There is not enough room. A backup is written to the same disk it protects, and this one would not fit with room to spare. Nothing was captured.                                                                                                       | Free space on the backups volume, or lower how many backups are kept.        |
| `BACKUP-2` | The archive could not be written and the capture stopped part-way. A configuration backup is what makes the rest recoverable, so it is worth fixing before a risky change.                                                                             | Check the backups volume is writable, then try again.                        |
| `BACKUP-3` | The room for a backup could not be measured. lemonfiber checks a backup will fit before starting one. Nothing was captured.                                                                                                                            | Check the backups location is reachable, then try again.                     |
| `BACKUP-4` | The stack was not confirmed stopped, so nothing was captured. Copying a database a service is writing to is the corruption a backup exists to prevent, so a running stack — and an engine that will not say whether it is running — are refused alike. | Stop the stack, check the container engine is answering, then capture again. |
| `BACKUP-5` | This run has nowhere it knows to keep an archive. A backup goes into lemonfiber's own directory, and this machine would not say where that is. Nothing was written.                                                                                    | Set a home directory for this user, then capture again.                      |
| `BACKUP-6` | This run has nowhere it knows to look for backups. They are kept in lemonfiber's own directory, and this machine would not say where that is, so there is nowhere to read a list of them from.                                                         | Set a home directory for this user, then ask again.                          |
| `BACKUP-7` | The backups kept here could not be listed. The directory lemonfiber keeps them in would not be read, so what is in it is not known. Nothing was touched.                                                                                               | Check the backups directory is readable, then ask again.                     |

How to read a row, what each severity and state means, and which exit each code leaves with are on [every error by code](/fixing/every-error-by-code/), beside every other family.
