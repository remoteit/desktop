# Where a new feature goes

The sidebar lists sections. Each section's pages are sub-links at the top of the section's panel, under its title (`frontend/src/helpers/navSections.ts`). URLs do not change: a section is a way in, not a route tree. On a phone the bottom bar has This device (apps only), Devices, Network and More. Place new work by this table.

| Section | Sub-links | Lands on |
| --- | --- | --- |
| This device | none (apps only) | This device |
| Devices | Devices, Connections, Services | Devices |
| Network | Networks, Exits, Public addresses, Proxy servers | Networks |
| Fleet | Products, Scripts, Apps | Products when the account has one, else Scripts |
| Team | Organization, Logs, Partner stats (partners only) | Organization |
| AI | Connect AI, Agent | Connect AI |
| footer | Announcements, Help, Settings | |

## Rules

1. A new feature joins an existing section and page first. It gets its own sub-link only when no existing page fits, and its own section almost never.
2. A page a person cannot use (plan, role, platform) is hidden by its gate in `navSections.ts`; a section with no page left is hidden.
3. Set-once and operator settings go under Settings, Advanced. Keep them away from the controls people use every day.
