import type { TFunction } from 'i18next'
import type { HowToUpdate, Support } from './graphQLDaemon'

/* Who upgrades a device that our rollouts do not, said for people — in the words the fleet view's managed column uses
   (fleetVersionsModel managedText: "updated by container image", "updated by Home Assistant") — and what to do to update
   it. Neutral: a container refusing our release is not failing. */
export function upkeepText(
  t: TFunction,
  how: HowToUpdate,
  format?: string | null
): { label: string; hint: string; icon: string } {
  switch (how) {
    case 'IMAGE':
      return {
        icon: 'box',
        label: t('upkeep.image', 'Updated by its container image'),
        hint: t('upkeep.imageHint', 'Pull the image again and recreate the container to update it.'),
      }
    case 'HOME_ASSISTANT':
      return {
        icon: 'house',
        label: t('upkeep.homeAssistant', 'Updated by Home Assistant'),
        hint: t('upkeep.homeAssistantHint', 'Update the remote.it add-on in Home Assistant (Settings → Add-ons).'),
      }
    case 'APP_STORE':
      return {
        icon: 'mobile',
        label:
          format === 'android'
            ? t('upkeep.googlePlay', 'Updated by Google Play')
            : t('upkeep.appStore', 'Updated by the App Store'),
        hint: t('upkeep.appStoreHint', 'Update the remote.it app from its store.'),
      }
    case 'RELOAD':
      return {
        icon: 'browser',
        label: t('deviceAgent.withPortal', 'Updates with the portal'),
        hint: t(
          'upkeep.reloadHint',
          "This browser's remote.it client loads from the portal: reload it to load the latest. Nothing here upgrades it."
        ),
      }
    case 'PACKAGE_MANAGER':
      return {
        icon: 'box-archive',
        label: t('upkeep.packageManager', 'Updated by its package manager'),
        hint: t('upkeep.packageManagerHint', "Upgrade remote.it with the system's package manager."),
      }
    case 'CLI':
      return {
        icon: 'terminal',
        label: t('upkeep.cli', 'Updated by the remote.it CLI'),
        hint: t('upkeep.cliHint', 'Upgrade it with the remote.it CLI that installed it.'),
      }
    case 'DESKTOP':
      return {
        icon: 'desktop',
        label: t('upkeep.desktop', 'Updated by remote.it Desktop'),
        hint: t('upkeep.desktopHint', 'Update remote.it Desktop on that machine.'),
      }
    case 'POLICY':
    default:
      return {
        icon: 'toggle-off',
        label: t('upkeep.policy', 'Updates turned off on the device'),
        hint: t(
          'upkeep.policyHint',
          "The device's administrator turned remote upgrades off: they upgrade it, or turn upgrades back on."
        ),
      }
  }
}

// "…; 1.5.0 is available": what an update would bring.
export const withAvailable = (t: TFunction, label: string, available?: string | null) =>
  available ? t('upkeep.available', '{{label}}; {{version}} is available', { label, version: available }) : label

// Below its kind's minimum build: too old for what the cloud still speaks, so to be updated, and how — its own way, or
// (our rollouts, or not known) by asking for the current release.
export function belowMinimumText(t: TFunction, support: Support, how: HowToUpdate | null, format?: string | null) {
  const label = t('upkeep.belowMinimum', 'Too old: remote.it needs {{minimum}} or newer here', {
    minimum: support.minimum,
  })
  const hint =
    how && how !== 'ROLLOUT'
      ? upkeepText(t, how, format).hint
      : t('upkeep.belowMinimumRollout', 'It upgrades with the next release its channel gives it, unless it is held.')
  return { label, hint: [support.message, hint].filter(Boolean).join(' ') }
}
