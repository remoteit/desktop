# Device Sessions in Desktop — Design

**Date:** 2026-09-30
**Repos:** `remoteit/desktop` (frontend); backend changes in `graphql-api` (branch `feat/device-subnet`, local)
**Branch:** `feat/device-sessions-ui`
**Status:** planning — nothing built

## Purpose

Surface the device-session daemon (connectd-go, installed by `device-package`) in desktop: what a device runs and
where its upgrade stands, the controls for remote upgrades, each device's name on the subnet, a page for the networks
devices belong to, and a device's **user mode**. All of it hidden behind one test flag until it is ready.

## Decisions (Evan, 2026-09-30)

1. **One flag for everything**, a setting on the Test UI page.
2. **Device status and remote-upgrade controls:** standby/active, version, update state; channel, auto-update, hold,
   rollback.
3. **The DNS name on the main device list**, from the user's view: the user (and their devices in user mode) reach
   every device they can access, so every device they can see has a name for them.
4. **A new Networks page** for device networks, for now — not folded into the existing Networks area. A graphical view
   of a network; adding and removing devices and services.
5. **User mode is a mode a device is in, not a privilege.** Laptops and phones will run in it all the time. No mailed
   code, no step-up.
6. **User mode is initiator-side only.** A device in user mode *reaches* what its user can; how others reach *it* — its
   services, as a target — stays in its networks as before.
7. **User-mode devices show on the Networks page**, in a side list ("full access").

## The flag

- A persisted `ui` setting, `deviceSessions: boolean`, in `models/ui.ts`: added to `SAVED_ACROSS_LOGOUT`, written with
  `dispatch.ui.setPersistent`. Stored per user, per machine, like `testUI`.
- A toggle on `pages/TestPage.tsx`, in a new **Experimental** section: "Device sessions".
- A hook, `useDeviceSessions()`, true only when **Test UI is on and the setting is on** — "Disable Test UI" turns it off
  with the rest, and nobody is left in it by accident. Every piece below checks the hook: components, routes (as
  `/account/connected` is gated in `routers/Router.tsx`), menu items, columns, and queries.
- **The API must have it too.** graphql serves these calls only when `DEVICE_SESSION_API` is on (local; dev once its
  infra is applied; off on prod). Flagged queries run only with the flag on, and a feature whose query fails with an
  unknown field hides itself rather than erroring — so the flag is safe on any API target. Demo it with the Test page's
  API target set to local or dev.

## 1. Device agent (status and upgrades)

On the device detail page, a **Device agent** section:

| Shows | From |
|---|---|
| The version it runs, and the one it should | `deviceDaemon` |
| Whether it is a device-session daemon or a legacy agent | `deviceDaemon` (none for a legacy agent) |
| The upgrade: pending, downloading, installing, installed, failed (why), refused (why: "older than the running …", "does not take updates", "cannot upgrade itself") | the report's `update` via `deviceDaemon` |
| Standby / active | a badge, only during a handover — it lasts seconds |

Controls, for a device the user manages:

- **Channel** (stable / beta) and **hold** (stay on this version): `setDeviceDaemon`.
- **Roll back** to the version before, confirmed — the only way a device goes to an older version.
- A legacy agent says it upgrades by reinstalling (the restore-code move), not remotely.

On the account (and organization) settings: **automatic updates** on/off and the account's **channel**:
`daemonSettings` / `setDaemonSettings`. Releasing to a channel (`setDaemonChannel`) is staff-only and stays out of
desktop for now.

## 2. The DNS name on the device list

- An optional **Name** column in the device list (the existing column picker), and the name with a copy button on the
  device page: `<device>.<owner>.on.remote.it`, and a service's host names where they apply.
- It is the name as the user sees it — the same for every device of theirs in user mode.
- Setting a device's label or short name (`setDeviceSubnetLabel`, `setSubnetBareNames`) and the account's slug
  (`setAccountSlug`) go on the device page and account settings.
- **Backend: a field is needed.** Names are assembled inside the subnet plan today; no field returns a device's name.
  Add `Device.subnetName` (and `Service.subnetName` for a host behind a device) in `SubnetNamesResolver`.

## 3. The Networks page (new)

A new page, `/device-networks` (the name is open), listing networks of devices, and a network's page with two views of
the same thing:

**List view** — built first:

- Members: each device with its **role** (initiator, target, both) and, for a target, what it exposes: **chosen
  services**, **all** (including ones added later), or **any port** (TCP/UDP ranges).
- Add a device (`addNetworkDevice`), change its role or exposure, remove it (`removeNetworkDevice`) — removal closes
  its connections at once.
- **Tag rules** — membership by tag, one per role (`setNetworkDeviceRule` / `removeNetworkDeviceRule`; account admins).
- **Invites** across owners — a device of someone else's joins only when its owner accepts (`inviteNetworkDevice`,
  `networkDeviceInvites`, `acceptNetworkDeviceInvite`, `declineNetworkDeviceInvite`).
- **Links** — a direct device-to-device link is a two-member network (`createDeviceLink`); listed, members fixed.
- A side panel, **Full access**: the user's devices in user mode, which reach everything the user can — so the page
  does not suggest a network is all a laptop reaches.

**Graph view** — built on the list:

- Initiators on one side, targets on the other, each target's exposed services under it; an edge where an initiator
  reaches a target through this network. User-mode devices in their own lane, "full access".
- Drag a device in to add it; draw an edge to make a link; select a member or an edge to change or remove it.
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — the usual choice for an editable node graph in React; it sits
  alongside MUI.

## 4. User mode

- A switch on the device page: **User mode** — "this device reaches what you can". For a device the user manages, set
  to the user who switches it on. Shown in the device list (an icon) and on the Networks page (Full access).
- **Backend changes** (graphql, on the device-principal work):
  1. **No mailed code.** Replace `requestDeviceActsFor` / `confirmDeviceActsFor` with one call —
     `setDeviceUserMode(deviceId, on)` — acting for the caller. `clearDeviceActsFor` becomes its off.
  2. **Initiator side only** — already so: user mode changes what the device may reach (`DevicePrincipal.permissions`,
     `subnetPlan`); whether others reach it is still its target memberships.
  3. **Add to, not replace, its own grants** — see the open question.

## Open questions

1. **User mode: add to the device's own initiator grants, or replace them?** Today it **replaces** them: in user mode
   the device's initiator memberships — a cross-owner invite accepted for the device, any-port reach — are ignored.
   Recommended: **add** (the union — grants are allow-only everywhere else). Switching the mode on then loses nothing,
   and a laptop keeps a link another owner gave it.
2. **Who a device in user mode acts for** when it is an organization's: the member who switched it on (proposed), or
   its owner.
3. **Plan size in user mode.** A user-mode device's subnet plan names every device its user can reach, carried whole in
   its desired state — fine for most users, heavy for an organization of thousands. Backend: a size limit, or names
   resolved on demand, later.
4. **The page's name and place** in the navigation, while it sits beside the existing Networks area.

## Order

1. The flag (`ui.deviceSessions`, the Test page toggle, `useDeviceSessions`) and the **Device agent** section — the
   backend is done.
2. The **Name** column — after `Device.subnetName` in graphql.
3. **User mode** — after the graphql change to one call (and the add-or-replace decision).
4. The **Networks page**, list view.
5. The **graph view**.

Each step lands behind the flag and is testable against r3-local (Test page → API target → local).
