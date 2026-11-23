# Where a new feature goes

The sidebar lists the sections (`frontend/src/helpers/navSections.ts`). Only the section you are in shows its pages, indented beneath it; a section with one page shows none. Each page takes the full width and is titled with its own name ("Exits", not "Network"). Clicking a section name opens the page last used in it. When the sidebar is hidden, the same list sits in the menu drawer. URLs do not change: a section is a way in, not a route tree.

On a phone the bottom bar has This device (apps only), Devices, Network and More. Tapping a section opens its list of pages: one row per page with its icon, name and a short line of state ("6 networks", "2 on"). Each page then has a back arrow to that list. More lists the other sections and the footer; each of those sections opens its own list the same way. A section with one page opens that page directly. The bar marks the section of the page you are on, and More for everything else.

Tabs inside a page stay tabs: a device's tabs, a network's Map, Devices and People, and Scripts, Runs and Files.

Place new work by this table.

| Section | Pages | Lands on |
| --- | --- | --- |
| This device | none (apps only) | This device |
| Devices | Devices, Connections, Services | Devices |
| Network | Networks, Exits, Public addresses, Proxy servers | Networks |
| Fleet | Products, Scripts, Apps | Products when the account has one, else Scripts |
| Team | Organization, Logs, Partner stats (partners only) | Organization |
| AI | Connect AI, Agent | Connect AI |
| footer | Announcements, Help, Settings | |

## Rules

1. A new feature joins an existing section and page first. It gets its own page only when no existing page fits, and its own section almost never.
2. A page a person cannot use (plan, role, platform) is hidden by its gate in `navSections.ts`; a section with no page left is hidden.
3. Set-once and operator settings go under Settings, Advanced. Keep them away from the controls people use every day.
