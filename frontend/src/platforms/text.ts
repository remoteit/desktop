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

  return {
    name: platform.name ? t(key(platform, 'name'), platform.name) : '',
    description: description ? t(key(platform, 'description'), description) : undefined,
    instructions:
      typeof instructions === 'string'
        ? instructions
          ? t(key(platform, 'instructions'), instructions)
          : undefined
        : instructions,
  }
}

export function usePlatformText(platform: IPlatform): PlatformText {
  const { t } = useTranslation()

  return platformText(t, platform)
}
