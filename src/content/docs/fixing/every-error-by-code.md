---
title: Every error by code
description: Every error code lemonfiber raises, what it means, and what to do about it, read from the crate that raises each one at the revision this site pins.
sidebar:
  order: 2
---

When lemonfiber refuses to do something, it says so in four parts: a **code**, a **summary** of what happened, what it **means** for you, and at least one **remedy** — something to do. The code is the stable part. It is one token, it is never recycled, and it is the thing to search for.

A code looks like `VPN-1`: a family, then a number. The family says which part of the stack raised it. The number identifies the problem within that family. This page lists every one of them.

There is no code on this page that lemonfiber cannot raise, and no code it can raise that is missing from it — checked against the revision of lemonfiber this site renders, which is named on the [changelog](/project/changelog/). A code added to lemonfiber after that revision appears here when the revision moves.

## How to read a row

Each table gives the code, what it means when you see it, and what the tool itself offers as the way forward. Where a message includes a name — a service, a path, a port — the tables describe the shape rather than quoting a template.

Two things are worth knowing before you start:

- **A problem always states what was and was not changed.** Most refusals happen before anything is written. Where something was written, the message says so.
- **A problem with no known remedy escalates rather than guesses.** Two codes on this page do that: they ask you for a [support bundle](/fixing/the-support-bundle/) rather than offer advice that might be wrong.

## SETUP — the first run

Raised while setup is gathering answers, applying them, or reversing an interrupted attempt.

| Code      | What it means                                                                                                                                                                                                                                                                        | What to do                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `SETUP-1` | Setup was asked to apply before its answers were reviewed. Nothing has been written.                                                                                                                                                                                                 | Answer every question, then confirm the review before applying.                            |
| `SETUP-2` | The data directory you chose could not be created. Setup stopped; the next run recovers it.                                                                                                                                                                                          | Check the location is on a writable disk, then try again.                                  |
| `SETUP-3` | A directory left by an interrupted setup could not be removed. The rest was reversed; this one directory holds nothing.                                                                                                                                                              | Remove it by hand, or leave it where it is.                                                |
| `SETUP-4` | Reversing a change needs the service that made it. Settings and directories were reversed; a resource a service created was not.                                                                                                                                                     | Reverse it from the service itself, once that service is reachable.                        |
| `SETUP-5` | An answer is not meaningful on the platform setup is running on. Nothing has been applied.                                                                                                                                                                                           | Answer with a choice this platform offers.                                                 |
| `SETUP-6` | Setup is past the point of gathering answers — it has been reviewed, is applying, or is finished. Nothing has been changed.                                                                                                                                                          | Resume or recover the setup in progress, or reconfigure a finished one.                    |
| `SETUP-7` | This machine already holds configuration, so setup is not what it needs. Answering setup again would walk a working stack back to its first question. Nothing has been changed.                                                                                                      | Change the setting you came to change, with `lemonfiber config set <key> <value>`.         |
| `SETUP-8` | A recovery was asked for and no setup here stopped part-way through applying. Recovering chooses what to do about a half-written apply, and there is none to choose about. Nothing has been changed.                                                                                 | Ask where setup stands, with `lemonfiber setup --status`, before choosing a way out of it. |
| `SETUP-9` | Reversing a change left some settings exactly as they are. They no longer hold what lemonfiber wrote, so they were changed after it, and putting the old value back would take away a decision you made. Everything else was put back, and the message names the ones it left alone. | Set them back by hand if the earlier value is the one you want.                            |

## CONFIG — your settings

Raised when the settings file cannot be read, written, or kept anywhere.

| Code       | What it means                                                                                                               | What to do                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `CONFIG-1` | Your settings exist and could not be read. Nothing has been changed — lemonfiber will not guess at settings it cannot read. | Check the file is readable. The message names its path. |
| `CONFIG-2` | Your settings could not be saved. The change was not made and your existing settings are untouched.                         | Check the location is writable and has space.           |
| `CONFIG-3` | There is nowhere to keep settings, because setup has not chosen a location yet.                                             | Run `lemonfiber setup`.                                 |

## STACK — the stack description

Raised about the manifest that describes what would be started. See [the stack manifest](/advanced/the-stack-manifest/).

| Code      | What it means                                                                                                                             | What to do                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `STACK-1` | No readable manifest was found where a stack was expected. A stack directory holds a `stack.toml` beside its compose files.               | Point at a directory containing `stack.toml`, with `lemonfiber --stack-dir <path>`. |
| `STACK-2` | The manifest is readable and was written for a different version of lemonfiber.                                                           | Update lemonfiber, or point at a stack this version reads.                          |
| `STACK-3` | This build of lemonfiber is not intact: the stack that ships inside the binary is missing. The build is supposed to make this impossible. | Nothing is known to fix this. Send a [support bundle](/fixing/the-support-bundle/). |
| `STACK-4` | There is nowhere to write the stack, because no location has been chosen.                                                                 | Run `lemonfiber setup`.                                                             |
| `STACK-5` | The stack could not be written to disk, so nothing can start. Usually a permission problem or a full disk.                                | Check the location is writable and has space.                                       |
| `STACK-6` | The manifest parses and contradicts itself: it says things about itself that cannot all be true.                                          | Fix the faults listed under the message. All of them were found in one pass.        |

## FORM — choosing what to run

Raised when a form cannot be resolved into something to start. See [forms and slices](/running/forms-and-slices/).

| Code     | What it means                                                                                                                                           | What to do                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `FORM-1` | No form was named, so there is nothing to start.                                                                                                        | Name a form, or list the ones this stack has with `lemonfiber forms`.                      |
| `FORM-2` | The stack declares no form by that name. Forms come from the stack rather than from lemonfiber, so a stack of your own may name them differently.       | Use one of the names it offers. The message suggests the nearest match and lists the rest. |
| `FORM-3` | One of the forms you named has to run on its own — what it starts would conflict with the others rather than add to them.                               | Run that form by itself.                                                                   |
| `FORM-4` | Everything these forms would start needs a download provider, and none is configured. Starting them would give you services that cannot fetch anything. | Add a Usenet provider, or a VPN and a torrent client, with `lemonfiber setup`.             |

## ENV — the container engine

Raised by the environment checks, before anything is started.

| Code    | What it means                                                                                                                                                                                       | What to do                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ENV-1` | Docker is not installed. lemonfiber runs your stack in containers, so nothing can start without an engine.                                                                                          | Install Docker Desktop, or Docker Engine on Linux.                                                                  |
| `ENV-2` | Docker is installed and its daemon is not answering, or would not start. The client being present usually means this is the daemon stopped, or a permission problem, rather than a missing install. | Start Docker Desktop, or the `docker` service on Linux. If it is running, check that your account may run `docker`. |
| `ENV-3` | The Docker Compose plugin is missing, or is too old. lemonfiber drives the stack through Compose v2.                                                                                                | Install or update the Docker Compose plugin. The message names the minimum version.                                 |

## DOCKER — talking to the engine

Raised by the engine adapter itself, wherever a command reaches it.

| Code       | What it means                                                                                          | What to do                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `DOCKER-1` | The container engine is not running. Nothing about your stack can be read or changed while it is down. | Start Docker Desktop, or the `docker` service on Linux. This is the first thing to fix. |
| `DOCKER-2` | A container that should be up is not. It may have stopped on its own, or never been started.           | Start the form that includes it. `lemonfiber ps` shows what is running.                 |

## PROC — the program underneath

Raised when the program lemonfiber shells out to is absent or will not run.

| Code     | What it means                                                                                                       | What to do                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PROC-1` | The program lemonfiber drives the engine through is not installed, so nothing can be started or stopped.            | Install Docker Desktop, or Docker Engine on Linux.     |
| `PROC-2` | The program is installed and would not start. Usually a permission or daemon problem rather than a missing install. | Check the container engine is running, then try again. |

## LIFE — starting and stopping

Raised around the lifecycle of a running stack. See [starting and stopping](/running/starting-and-stopping/).

| Code     | What it means                                                                                                                                                                                                                          | What to do                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `LIFE-1` | A service never reached a state that starting could accept, so the run did not finish starting.                                                                                                                                        | Look at what the service said, then start it again: `lemonfiber logs <service>`.                                            |
| `LIFE-2` | Stopping would take services out from under another form that is still running. Nothing was stopped.                                                                                                                                   | Stop both if neither is wanted, or leave both up. A service two forms reach belongs to whichever you are using.             |
| `LIFE-3` | Another lemonfiber run is already working on this stack, so this one stopped before doing anything. Two runs issuing commands about the same containers leave the stack in a state neither asked for.                                  | Wait for the other run to finish, then run this again. If you are sure that run is gone, `--force` takes the stack from it. |
| `LIFE-4` | Fetching images is switched off, so nothing was fetched. `LEMONFIBER_REACH_REGISTRY` is off, so this machine asks no registry for anything: a start uses the images already here, and a service whose image is missing will not start. | Turn fetching back on with `lemonfiber config set LEMONFIBER_REACH_REGISTRY on`, then run this again.                       |

## STORAGE — the data location

Raised by the storage checks. [Hardlinks and one mount point](/fixing/hardlinks-and-one-mount-point/) explains what each of these costs.

| Code        | What it means                                                                                                                                                                                                                                                                                  | What to do                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `STORAGE-1` | The data location cannot hardlink, so imports copy: each takes minutes rather than being instant, uses twice the disk while it runs, and torrents cannot seed from the library copy. Where the filesystem type explains it — exFAT, FAT, SMB, NFS, the WSL2 boundary — the message names that. | Choose a location that hardlinks, or continue in copy mode. The services are configured to copy, so imports still work.                    |
| `STORAGE-2` | The data location exists and cannot be written to. The services have to own what they import, so every import fails far from where the cause shows.                                                                                                                                            | Give the account that runs the services write access to the data location.                                                                 |
| `STORAGE-3` | The data location could not be reached. A stack that wrote into a missing mount point would build a phantom library on the system disk.                                                                                                                                                        | Check the location exists and any drive holding it is connected.                                                                           |
| `STORAGE-4` | Free space is low, or is projected to run out against what is already queued. A disk that fills partway through an import leaves half a file behind and stalls the queue.                                                                                                                      | Free space on the data location, thin the download queue, or move it to a larger volume.                                                   |
| `STORAGE-5` | The data location used to hardlink and no longer does — usually a drive that came back mounted with different options. Every import since has been copying.                                                                                                                                    | Check how the data location is mounted, and remount it as it was. A network share remounted without the right options is the common cause. |
| `STORAGE-6` | You own the data location and the containers cannot write it: they run as one user and ID pair, and the directory's ownership and mode do not allow them. Imports fail inside the services.                                                                                                    | Give the service user ownership of the data location, or write access to it.                                                               |

## QUAL — quality against what is available

Raised where the chosen quality preset and the world disagree. See [quality presets](/running/quality-presets/).

| Code     | What it means                                                                                                                                                                                                          | What to do                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `QUAL-1` | The free space is thin for the chosen preset — it holds only a few hours of content at that quality. Nothing is broken and nothing already downloaded is affected; new acquisitions will simply fill the disk quickly. | Free space, move the data location to a larger volume, or choose a lighter preset for the media that does not need it. |
| `QUAL-2` | Releases exist for wanted content and the chosen preset wants none of them. The indexer is working; the preset is stricter than what can be found.                                                                     | Choose a less demanding preset for that media, or wait for a matching release. The content stays wanted either way.    |
| `QUAL-3` | A clean search turned up nothing at all for wanted content. The indexer answered — this is not an indexer failure — there is simply nothing to grab yet.                                                               | Check the indexer carries this content, or wait. No action is needed if it is merely not out yet.                      |

## VPN — traffic leaving the tunnel

Raised by the VPN checks. [Is my VPN hiding me?](/fixing/is-my-vpn-hiding-me/) explains how each is established.

| Code    | What it means                                                                                                                                                                                                                                                                  | What to do                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VPN-1` | The download client's traffic is not going through the VPN: its public address does not match the tunnel's, or it has connectivity the tunnel does not. Peers in every swarm can see your home address. This is the one failure whose consequences reach outside your machine. | Stop torrent transfers now, then confirm the client shares the VPN's network — `network_mode: service:<gateway>` in the stack.                                                |
| `VPN-2` | The VPN container that should carry traffic is not running. Nothing routes through a tunnel that is not up, so torrents cannot transfer — though nothing is leaking while it is down.                                                                                          | Start the form that includes it, then read its logs: `lemonfiber logs <gateway>`.                                                                                             |
| `VPN-3` | The tunnel is up and the client could not reach the internet through it. Nothing is leaking, and torrents will not transfer until it can.                                                                                                                                      | Confirm the client uses the VPN container's network.                                                                                                                          |
| `VPN-4` | The tunnel is up and no port was forwarded, so peers cannot open connections to your client: download connectivity and seeding are both reduced. It cannot be fixed while the stack is running.                                                                                | Regenerate the VPN credentials with port forwarding enabled. On ProtonVPN that means enabling NAT-PMP and picking a P2P server when the WireGuard configuration is generated. |
| `VPN-5` | The tunnel was dropped on purpose and the download client still reached the internet. Every torrent would continue in the open the moment the VPN fails, and a VPN that never fails is not a thing.                                                                            | Enable the tunnel container's own killswitch. For gluetun that is `FIREWALL=on`, which is its default.                                                                        |
| `VPN-6` | The killswitch test dropped the tunnel and could not confirm putting it back. The stack is left without one, and whether traffic is flowing outside it is exactly what is now unknown.                                                                                         | Restart the tunnel container now.                                                                                                                                             |
| `VPN-7` | The provider forwards one port and the download client is listening on another. Downloads still arrive, so nothing looks wrong — but no peer can reach the client, so it cannot seed and connects to fewer sources.                                                            | Run `lemonfiber up` to move the client onto the forwarded port.                                                                                                               |
| `VPN-8` | The stack declares torrents and no VPN-contained client to run them through, so every torrent is visible under this connection's own address — to the network it is on, and to every peer in the swarm.                                                                        | Put the torrent client behind a VPN container in the stack. Where this is deliberate, answer it once with `lemonfiber doctor --accept vpn.unprotected`.                       |

## BIND — where the stack is actually listening

Raised by the check that asks the container engine what it published, rather than reading what a file meant to publish. See [run the doctor](/fixing/run-the-doctor/).

| Code     | What it means                                                                                                                                                                                                                                                                                                             | What to do                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BIND-1` | A service the stack calls an admin service is reachable from your network. It is meant to answer this machine and nothing else: it can change how your stack works, and most services like it have weak or no password of their own, so anything on your network reaching it is a way in.                                 | Publish it on this machine only, and apply the change. The message names the address to use. Or, if you meant to expose it, say so once and say why, with `LEMONFIBER_EXPOSED=<service>=<why>` in your settings.                        |
| `BIND-2` | A firewall rule on this machine may not apply to the ports the stack publishes. The container engine runs directly on this machine here, and it writes its own forwarding rules ahead of the ones you add, so a port you believe is shut may still answer. This is how publishing is meant to work and nothing is broken. | Narrow what the household tier is published on, which is what does decide: `LAN_BIND` in your settings, set to this machine's own address on your network. Or leave it, if every device on this network is one you would let in anyway. |
| `BIND-3` | An admin service is reachable from your network and you have written down that you meant it to. It is still reported, because the exposure is real either way; what changed is whose decision it is. The message quotes your reason back.                                                                                 | Nothing, if that is still true. Or take it out of the exposed list and publish it on this machine only.                                                                                                                                 |

## CRED — credentials a service refuses

Raised when a service or an indexer rejects a key it should accept.

| Code     | What it means                                                                                                                                                                                                                            | What to do                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `CRED-1` | A service answered and refused the credential it generated itself. The key in its configuration no longer matches the one the running service expects, usually because the configuration was regenerated after the service last started. | Restart the service so it reloads its configuration, then check again: `lemonfiber restart`. |
| `CRED-2` | The indexer answered and rejected the API key configured for it. The key is wrong, expired, or for a different indexer — searches through it come back empty.                                                                            | Correct the indexer's API key in configuration, then check again.                            |
| `CRED-3` | The indexer accepted the key and would not serve the request — usually a rate or quota limit that lifts on its own. The key is not wrong.                                                                                                | Leave it a while and check again.                                                            |

## PROVIDER — accounts and indexers

Raised by the provider health checks against your download client and indexer aggregator.

| Code         | What it means                                                                                                                                                                                                                                         | What to do                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PROVIDER-1` | A Usenet account has nothing left. It authenticates perfectly and can download nothing, which looks exactly like a broken stack from the outside. A block account does not refill on its own.                                                         | Top the account up, or point the client at one that has data left.                                                                |
| `PROVIDER-2` | A Usenet account is running out, with time left to act. At the rate it is being used it runs out shortly, and downloads will stop with nothing else having changed.                                                                                   | Top the account up before it runs out.                                                                                            |
| `PROVIDER-3` | The subscription behind a Usenet account ends on the date recorded for it in the download client. When it lapses the account stops serving.                                                                                                           | Renew the subscription, or clear its date in the client if it renews itself.                                                      |
| `PROVIDER-4` | An indexer has been failing and its aggregator has rested it. Searches through it are not coming back; the others still are, so releases are found from a smaller pool.                                                                               | Check the indexer's subscription and its status page, then test it in the aggregator.                                             |
| `PROVIDER-5` | Every indexer is failing at once. Indexers do not all fail on the same afternoon, so the cause is almost always on this side of the connection.                                                                                                       | Check this machine's network and DNS, and the tunnel if searches run through one.                                                 |
| `PROVIDER-6` | A Usenet account is refusing the login. The provider answered the download client and rejected the credentials it offered. Every service stays green while nothing downloads.                                                                         | Check the account's username and password in the download client, and that the subscription behind it is still active.            |
| `PROVIDER-7` | A Usenet account has stopped answering the client entirely. That is the provider being down or the connection to it failing, rather than anything about the account — which is worth telling apart from a rejected login before changing anything.    | Check the provider's status page and this machine's connection. The client picks the account up again on its own once it answers. |
| `PROVIDER-8` | The download client is set to open more connections than the account allows, and the provider refuses the ones beyond the plan. Downloads still run on the rest, and the refusals read as an unreliable provider rather than as one setting too high. | Lower the connection count for that account in the download client to what the plan includes.                                     |
| `PROVIDER-9` | An indexer has spent the allowance recorded against it. Searches through it come back empty until it resets, and neither it nor the aggregator says so anywhere.                                                                                      | Wait for the allowance to reset, or raise the limit recorded for that indexer in the aggregator if the subscription allows more.  |

## WIRING — drift between services

Raised when a download client no longer files where lemonfiber wired it. See [adopt and reset](/advanced/adopt-and-reset/).

| Code       | What it means                                                                                                                                                                                                                                                                                                                                  | What to do                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WIRING-1` | A service and its download client have drifted apart. Either the client still files under a category lemonfiber has moved on from, so anything filed since is somewhere the rest of the stack no longer looks; or you moved the client off lemonfiber's category and the service can no longer reach it, so the queue fills and never empties. | Let lemonfiber bring it up to date with `lemonfiber doctor --fix`. To keep your own value instead, adopt it with `lemonfiber adopt`; to discard it and restore lemonfiber's, run `lemonfiber reset --confirm`. |

## SEED — wiring the services together

Raised while seeding, when a service will not co-operate. Seeding is resumable: everything already made is valid, and running it again finishes the rest.

| Code     | What it means                                                                                                                                                  | What to do                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `SEED-1` | A service was not answering yet, so it was skipped. Nothing was changed for it.                                                                                | Wait for it to finish starting, then run `lemonfiber seed` again.                                                                        |
| `SEED-2` | A service rejected the credential lemonfiber holds, usually because it was changed in the service's own interface.                                             | Have lemonfiber re-read the service's credential with `lemonfiber doctor --fix`.                                                         |
| `SEED-3` | A service answered in a way lemonfiber does not recognise, so it will not guess at what would fix it.                                                          | Nothing is known to fix this. Send a [support bundle](/fixing/the-support-bundle/); the service's own words are attached to the message. |
| `SEED-4` | A service is past — or stands before — the API version this build speaks, so writing to it would mean writing something malformed. Nothing was changed for it. | Match the service to the version lemonfiber supports, or update lemonfiber, then run `lemonfiber seed` again.                            |

## BACKUP — capturing your configuration

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

## RESTORE — putting configuration back

Raised by `lemonfiber restore`. Every one of these refuses before anything is overwritten except `RESTORE-6` and `RESTORE-10`, which are the two that reach you with files already written.

| Code         | What it means                                                                                                                                                                                                                                                                   | What to do                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `RESTORE-1`  | The archive could not be read. Most often it is truncated, or is not a lemonfiber backup. Nothing was touched.                                                                                                                                                                  | Check the archive, or restore from a different backup.                                                                   |
| `RESTORE-2`  | The archive was written by a newer lemonfiber than this one, and may hold configuration this version would not restore correctly. Nothing was touched.                                                                                                                          | Update lemonfiber to at least the version that made the backup, then restore.                                            |
| `RESTORE-3`  | The archive's format cannot be restored by this build. Restoring it could leave the configuration in a state neither version expects. Nothing was touched.                                                                                                                      | Restore it with the lemonfiber version that made it.                                                                     |
| `RESTORE-4`  | The archive holds an entry naming a path that leaves the directory it belongs in, which a genuine lemonfiber backup never does. It is refused and nothing was touched.                                                                                                          | Do not restore this archive. It is corrupt, or was tampered with.                                                        |
| `RESTORE-5`  | The archive was taken against a different data root. Restoring it unchanged would keep a setting naming a location that is not on this machine.                                                                                                                                 | Re-run the restore with `--repoint` to accept moving it to this machine's data root.                                     |
| `RESTORE-6`  | The archive could not be unpacked, and the restore stopped part-way through writing the configuration back.                                                                                                                                                                     | Check the configuration location is writable and restore again. A seed afterwards reconciles anything left half-written. |
| `RESTORE-7`  | The stack was not confirmed stopped, so nothing was touched. A restore writes over the service databases, and an engine that will not say whether the services are running is refused as firmly as one that says they are.                                                      | Stop the stack, check the container engine is answering, then restore again.                                             |
| `RESTORE-8`  | The name you gave is not one of the backups kept here. A restore by name reaches one of the archives this machine took, which are files in a single directory; a name carrying a path, or climbing out of that directory, is refused rather than followed. Nothing was touched. | Ask for one of the backups by the name it was written under.                                                             |
| `RESTORE-9`  | This run has nowhere it knows to look for a backup. Archives are kept in lemonfiber's own directory, and this machine would not say where that is. Nothing was touched.                                                                                                         | Set a home directory for this user, then restore again.                                                                  |
| `RESTORE-10` | The archive was unpacked, and the data root it recorded could not be changed to this machine's — so the settings that landed name a library that is not here.                                                                                                                   | Set the data root by hand, then run `lemonfiber seed`.                                                                   |
| `RESTORE-11` | What you agreed to is not what this backup would do now. A fresh look at the archive lists something else, so something changed between reading the listing and answering it. Nothing was overwritten.                                                                          | Ask what the backup holds again, and read what it says now.                                                              |

## BUNDLE — the support bundle

Raised by `lemonfiber support`. [The support bundle](/fixing/the-support-bundle/) explains what it holds and why.

| Code       | What it means                                                                                                                                                                                                                                                                                | What to do                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `BUNDLE-1` | The finished bundle still held something that reads as a credential, so nothing was written. A bundle is a thing people post in public, so anything in one that still looks like a key is treated as one — even where it turns out not to be.                                                | Report which file the message names, so the value it holds can be added to what a bundle knows how to replace. |
| `BUNDLE-2` | There is not enough room to write the bundle where it was to be written, with space left over for the machine to keep working in.                                                                                                                                                            | Free some space, or write the bundle somewhere with more room using `--out`.                                   |
| `BUNDLE-3` | The archive could not be written. Nothing was left behind: a bundle is written whole or not at all, so there is no half-file to mistake for one.                                                                                                                                             | Check the path is writable, then ask for the bundle again.                                                     |
| `BUNDLE-4` | A setting was asked to be shown as it is, without that being confirmed on the same run. Showing one puts the real value in a file people post in public, so it takes saying twice.                                                                                                           | Run it again with `--confirm` if you meant it.                                                                 |
| `BUNDLE-5` | The machine could offer no randomness to derive the stand-ins from, so nothing was written. A stand-in anyone can reproduce is a way back to the value it stands for.                                                                                                                        | Report this. A machine that cannot produce random bytes is a fault in its own right.                           |
| `BUNDLE-6` | This run can write no archive at all: it holds neither a directory of its own to keep one in nor anything to pack one with, which is what a machine that will not say where its own files go leaves behind. A bundle asked for at a named path is refused here too, and nothing was written. | Set a home directory for this user, then ask for the bundle again.                                             |
| `BUNDLE-7` | This run has nowhere it knows to look for a bundle. Bundles asked for by name are kept with lemonfiber's own files, and this machine would not say where those are, so there is nowhere to read one back from.                                                                               | Set a home directory for this user, then ask for the bundle again.                                             |
| `BUNDLE-8` | The name you gave is not one of the bundles kept here. A bundle asked for by name is one of the files this run wrote into lemonfiber's own directory; a name holding a path, or climbing out of that directory, is refused rather than followed.                                             | Ask for a bundle by the name the run that produced it reported.                                                |

## KEPT — what lemonfiber keeps here

Raised by `lemonfiber stored` and `lemonfiber forget`, which list what lemonfiber keeps on this machine and remove it.

| Code     | What it means                                                                                                                                                                                                                                                                                                               | What to do                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `KEPT-1` | This run cannot say where lemonfiber keeps its own files. The configuration and data directories are worked out from this machine's own conventions, and that did not work here, so there is nothing to list and nothing safe to remove. Guessing at the usual place would risk naming a directory that is somebody else's. | Run this as the account that installed lemonfiber, on a machine with a home directory it can read. |

## WATCH — guarding the data location

Raised by `lemonfiber watch`, which stops the forms you name if the data location disappears under them.

| Code      | What it means                                                                                                                          | What to do                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `WATCH-1` | No data location is configured, so there is nothing for a watch to guard.                                                              | Run `lemonfiber setup` to choose a data location, then start the watch again. |
| `WATCH-2` | The data location is already gone when the watch was asked to start. A watch can only guard a location that is present when it begins. | Connect the drive or mount holding the data location, then start the watch.   |

## DIAG — narrowing a diagnosis

Raised by `lemonfiber doctor --only`, which runs one category of check, or one check by the name a finding gives it.

| Code     | What it means                                                                                                                                                                                                                         | What to do                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `DIAG-1` | Nothing on this stack reports under the name you narrowed the run to. A check is named by the identifier its finding carries, and no finding here carries that one. Answering with an empty report would read as nothing being wrong. | Run the checks with `lemonfiber doctor`, and narrow to a name this stack reports. |

## REPAIR — putting right what the doctor found

Raised by `lemonfiber doctor --fix`, which offers repairs, and `--undo`, which puts the last one back. See [run the doctor](/fixing/run-the-doctor/).

| Code       | What it means                                                                                                                                                                                                                                                                                                                                                | What to do                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPAIR-1` | What you agreed to is not what is offered now. A fresh look offers something else, so something changed between reading the offer and answering it. Nothing was carried out.                                                                                                                                                                                 | Ask what could be put right again, and read what it says now.                                                                                                   |
| `REPAIR-2` | This run has nowhere it knows to look for what a repair changed. What each repair changed is recorded in lemonfiber's own directory, and this machine would not say where that is. Nothing was put back.                                                                                                                                                     | Set a home directory for this user, then ask again.                                                                                                             |
| `REPAIR-3` | Saying what could be put right does not include the checks that disturb. Those checks prove themselves by disturbing — the killswitch test takes the tunnel away from the download client, and the release check spends one of the indexers' daily searches — and a run that only says what it would put right has agreed to neither. Nothing was disturbed. | Ask for the diagnosis with those checks in it, with `lemonfiber doctor --disruptive`. Or agree to the repairs first, and the checks that disturb run with them. |

## ACK — answering a warning

Raised by `lemonfiber doctor --accept`, which records that you have weighed a choice and its cost so it stops leading.

| Code    | What it means                                                                                                                                | What to do                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ACK-1` | The check you named is not something this run is warning about. An answer is only meaningful against something the tool is currently saying. | Answer one of the warnings this run raised — the message lists them. If it raised none, run the checks first. |

## WORD — the glossary

Raised by `lemonfiber explain`. See [the words we use](/start/words-we-use/).

| Code     | What it means                                                                                                                                                                                                                                                     | What to do                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `WORD-1` | The word you asked about is not one this product explains. What it explains is this ecosystem's own vocabulary — the words that are load-bearing and cannot be guessed. Having no entry is not the same as meaning nothing, and nothing is wrong with your stack. | Ask about one of the words its reports use. The message lists every word it knows. |

## SERVE — the web surface

Raised by `lemonfiber ui`. See [the web API](/api/).

| Code      | What it means                                                                                                                                                                                                                                            | What to do                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SERVE-1` | The address could not be taken, so there is nowhere for a browser to connect. Usually something else on this machine is already listening there.                                                                                                         | Ask for a different port with `lemonfiber ui --port 7171`, or name no port at all and be given a free one.                     |
| `SERVE-2` | A token could not be minted for this run. Every request to this surface has to carry a secret only that run knows, and this machine would not supply the unpredictable bytes it is made of.                                                              | Run it again. If it happens twice, the operating system's own random source is at fault.                                       |
| `SERVE-3` | The web interface was asked to answer your network and no password is set, so it was not offered. This surface can start, stop and reconfigure everything and reaches every password the system holds, so anything on that network could do all of that. | Set a password and ask again, with `lemonfiber ui --set-password --lan`. Or leave it as it is, and reach it from this machine. |

## ADMIT — the web interface's password

Raised while setting the password `lemonfiber ui` asks for before it will answer anything but this machine. See [the web API](/api/).

| Code      | What it means                                                                                                                                                                                                                               | What to do                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIT-1` | That password is too short to be the one. It is the only thing standing in front of a surface that can start, stop and reconfigure everything, and what is on the other side of it is a program that guesses without getting bored.         | Use at least twelve characters. Several unrelated words are easier to keep and harder to guess than one word with substitutions in it. |
| `ADMIT-2` | The password could not be recorded. Every stored password is mixed with unpredictable bytes so that two of them are never written down the same way, and this machine would not supply any.                                                 | Try again. If it happens twice, the operating system's own random source is at fault.                                                  |
| `ADMIT-3` | The two passwords typed were not the same, and nothing was changed. It is asked for twice because nothing here can read one back afterwards, so the second answer is the only check there is that the first was typed the way it was meant. | Set it again, typing the same password both times.                                                                                     |

## READ — asking the web surface a question

Raised by the read endpoints `lemonfiber ui` serves, about the query string a request arrived with. See [the envelope](/api/the-envelope/).

| Code     | What it means                                                                                                                                                                                                       | What to do                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `READ-1` | The read you asked for takes no parameter by that name. It is refused rather than ignored, because ignoring it would answer a wider question than the one that was asked, and a wider answer reads like the answer. | Ask again, naming only what this read takes. The message lists them. |
| `READ-2` | A parameter that names one thing was given more than once. Which of them was meant is not something this can work out, and answering for one of them would drop the others without saying so.                       | Ask again, naming it once.                                           |

## TUI — the terminal interface

Raised by the interactive surface. See [the TUI](/commands/the-tui/).

| Code    | What it means                                                                                                                                | What to do                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `TUI-1` | A screen could not be drawn. The terminal stopped accepting output, which usually means it was closed or resized out from under the process. | Run it again in a terminal that stays open. |

## Severity

Every problem carries one of four levels. There are four deliberately: more would not be applied consistently, and inconsistent severity is worse than coarse severity.

| Severity   | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `advisory` | Informational. Nothing is required.                |
| `warning`  | Degraded or risky, and still working.              |
| `error`    | Something is broken.                               |
| `critical` | Consequences outside the machine, or data at risk. |

Only four codes are raised as `critical`: `VPN-1`, `RESTORE-4`, `BUNDLE-1` and `STACK-3`. Three of them are about something leaving your machine that should not.

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
- `STACK-1`, `STACK-6` and `CONFIG-1` exit `5` — they are about what you wrote.
- Everything else exits `1`.

Some commands decide their exit from their result rather than from a problem:

- `lemonfiber doctor` exits `0` when the overall verdict is healthy or degraded, and `1` when it is broken or unknown. Reporting success when nothing could be verified is the falsehood the checks exist to avoid.
- `lemonfiber seed` exits `5` when a conflict you wrote blocks it, and `1` when work was merely skipped or failed and may complete on a re-run.
- `lemonfiber quality set`, `lemonfiber quality upgrade` and `lemonfiber reset` exit `5` when they are holding a change that needs your confirmation.
- `lemonfiber doctor --fix` exits non-zero when anything was left unmended.
- Queries — `trace`, `stuck`, `household`, `ps`, `version`, `forms`, `config` — always exit `0`. Asking is never a failure, whatever the answer.

## Where these come from

The codes on this page are read from the crate that raises each one, at the revision this site is pinned to. Each is declared as a constant beside the code that raises it, rather than in a central list, so a code and its meaning move together — and no code is ever recycled, so a search that found an answer once finds the same answer later.

The crate emits the whole list, and this site's own gate compares that list against this page in both directions on every change. So the sentence at the top of the page is checked rather than promised: a code added to the crate and not to this page fails the build, and so does a code on this page that nothing raises.

For the model behind them — why a problem cannot be constructed without a remedy, how a typed failure becomes something you read, and why the core never formats — see [the error model architecture note](/develop/architecture/error-model/). The requirement it is written against is [G4, the error and remedy model](/spec/10-functional/features/g-ux/g4-error-model/).
