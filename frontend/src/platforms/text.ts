import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { IPlatform } from '.'

// See ./README.md, Translations.
const key = (platform: IPlatform, field: string) => `platforms:${platform.id}.${field}`

export interface PlatformText {
  name: string
  description?: string
  // JSX instructions (6 platforms keep theirs in code) pass through untranslated.
  instructions?: string | React.ReactNode
}

export function platformText(t: TFunction, platform: IPlatform): PlatformText {
  const { description, instructions } = platform.installation ?? {}

  // An empty default makes i18next return the key itself (returnEmptyString: false), and a
  // platform whose module has not loaded yet has no id — both would render as "<id>.name".
  if (!platform.id) return { name: platform.name ?? '', description, instructions }

  // A field is translated only when it carries text — an empty default would render as its key.
  const tr = (field: string, value?: string) => (value ? t(key(platform, field), value) : undefined)
  return {
    name: tr('name', platform.name) ?? '',
    description: tr('description', description),
    instructions: typeof instructions === 'string' ? tr('instructions', instructions) : instructions,
  }
}

export function usePlatformText(platform: IPlatform): PlatformText {
  const { t } = useTranslation()

  return platformText(t, platform)
}
