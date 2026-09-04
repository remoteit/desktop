import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { IPlatform } from '.'

// Platform copy (name, description, instructions) is English in the API catalogue and translated
// here, in the `platforms` namespace, keyed by route slug. The keys are built at render time, so
// i18next-parser cannot extract them — scripts/platforms-generate.mjs maintains the catalogs
// instead, the same arrangement the parser config documents for the `columns.<id>` labels.
//
// The catalogue string is always the inline default, so a platform whose row has not been through
// the generator still renders its English rather than a key. Keys are namespace-prefixed so this
// works with whatever `t` the caller already has.
const key = (platform: IPlatform, field: string) => `platforms:${platform.id}.${field}`

export interface PlatformText {
  name: string
  description?: string
  // JSX instructions (6 platforms keep theirs in code) pass through untranslated.
  instructions?: string | React.ReactNode
}

export function platformText(t: TFunction, platform: IPlatform): PlatformText {
  const { description, instructions } = platform.installation ?? {}

  return {
    name: t(key(platform, 'name'), platform.name),
    description: description === undefined ? undefined : t(key(platform, 'description'), description),
    instructions: typeof instructions === 'string' ? t(key(platform, 'instructions'), instructions) : instructions,
  }
}

export function usePlatformText(platform: IPlatform): PlatformText {
  const { t } = useTranslation()

  return platformText(t, platform)
}
