// The kinds, in graphql's order (KINDS: * first, then HOW_TO_UPDATE), with what an admin reads for each.
export const MINIMUM_KINDS: { kind: string; label: string; hint: string }[] = [
  { kind: '*', label: 'Every kind', hint: 'Every device whose kind has no minimum of its own' },
  { kind: 'rollout', label: 'Our rollouts', hint: 'Package installs and self-updating containers' },
  { kind: 'image', label: 'Container image', hint: 'Containers updated by pulling the image' },
  { kind: 'home-assistant', label: 'Home Assistant', hint: 'The add-on, updated in Home Assistant' },
  { kind: 'app-store', label: 'Phone apps', hint: 'iPhone and Android, updated from their stores' },
  { kind: 'reload', label: 'Browser client', hint: 'Updated when its page loads the client published last' },
  { kind: 'package-manager', label: 'Package manager', hint: "Upgraded with the system's package manager" },
  { kind: 'cli', label: 'remote.it CLI', hint: 'Upgraded with the CLI that installed it' },
  { kind: 'desktop', label: 'remote.it Desktop', hint: 'Updated with Desktop' },
  { kind: 'policy', label: 'Updates turned off', hint: 'Its administrator turned remote upgrades off' },
]
