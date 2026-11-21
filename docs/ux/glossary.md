# Glossary

One name per concept. Every user-facing string in the portal and the tray menu uses the word in the "Use" column. The words in "Do not use" are retired; existing strings move off them in later changes.

| Concept | Use | Do not use |
| --- | --- | --- |
| The brand | Remote.It | remote.it (in prose; addresses such as `x.on.remote.it` keep their spelling) |
| Reaching your devices by name | Access | Device subnet, Reach devices by name, subnet |
| Sending a device's traffic through another device | Route through | Protect, remote.it Protect, VPN |
| The thing you route through | exit; the device behind it is an "exit device" | exit node, "Runs on" |
| A device's or service's `.on.remote.it` name | address | DNS name, subnet name, Name on your network |
| A web address for a service through a proxy | public address | proxy endpoint, endpoint |
| A proxy you run yourself | proxy server | Proxy (as a page name) |
| Network roles | "Can reach" and "Can be reached" | Initiator, Target |
| The software on a device | agent | daemon, connectd, device package, remote.it device, Control Link, Classic |
| Getting a newer agent | update | upgrade |
| The shell on a device | terminal | console, web SSH, shell |
| The fallback when a direct link fails | relay | reflector (websocket) |
| Bringing back a disabled device | restore | |
| Re-keying a machine with a code | recover | restore (in this sense) |
| Removing a device for good | delete permanently | decommission |
| The device that reaches a virtual device | gateway | hosted by, hosting, hosts |
| Letting people reach this machine's services | Share this Mac (or "this PC", "this device") | Allow remote access to services |
| What a device does for others | "Shares its connection", inside settings | the "Runs" tab |
| Software added to a device | apps | |

## Access levels

Access has three levels. They replace the separate "User mode" setting.

- Off
- Networks only
- Full access as (the person's name)

The label of the top level is still open. Never call it "Admin" or "Owner".

## Still open

Leave these as they are until they are decided:

- Fleet terms: join key, one-time code, registration code.
- The launch name.

## The wording test

`frontend/src/i18n/wordingRatchet.test.ts` counts the English catalog strings that use each retired word. A count may fall, never rise. The counts live in `frontend/src/i18n/wordingBaseline.json`. When a count falls, lower it in the same commit:

```sh
cd frontend && UPDATE_WORDING_BASELINE=1 npx vitest run src/i18n/wordingRatchet.test.ts
```

The update only lowers counts. Placeholders such as `{{target}}` are ignored. Some retired words are also correct in another sense, so the test narrows or skips them:

- remote.it: any spelling but "Remote.It" counts, except inside an address, URL or email (`on.remote.it`, `https://remote.it/x`, `x@remote.it`).
- Protect: only the capitalized feature name; "Protect your account" is a plain verb.
- Runs on: only the capitalized label; apps legitimately run on platforms.
- upgrade: plan and license upgrades are billing words and are left out, as is the bare "Upgrade" button.
- hosted by / hosts / Hosting: only "hosted by" (not "hosted by remote.it", which is file hosting), "hosts {{count}}" and the "Hosting" title; hosting a web app or game server is fine.
- console: singular only; game "consoles" are fine.
- Initiator: also counts "initiating".
- Not counted: subnet on its own (a network subnet is a real thing; "device subnet" and "subnet name" are counted), VPN (app types and the system VPN prompt), Target (script and job targets), shell (shell scripts), restore (correct for disabled devices), Proxy as a page name and the "Runs" tab (script runs share the word).

The test also counts strings longer than 25 words and strings with the internal words stage, daemon, connectd or sudo. See [voice.md](voice.md).
