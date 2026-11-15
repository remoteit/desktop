import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ListItem, TextField } from '@mui/material'
import type { TFunction } from 'i18next'
import { AppStringRules, DeviceAppSetting as Setting } from '../services/graphQLDeviceApps'
import { settingLocked } from '../services/graphQLDeviceSettings'
import { DeviceSettingChoice, DeviceSettingRow, deprecatedLine, settingNote } from './DeviceSettingRow'
import { spacing } from '../styling'

type Props = {
  setting: Setting
  label: string
  help?: string | null
  disabled?: boolean // not one who manages the device, or a change under way
  onChange: (value: any) => void
  // A deprecated setting with a value set: clear it back to its default (then it is no longer shown).
  onClear?: () => void
}

/* One of an app's settings, drawn from its release's declaration (presence-server docs/device-apps-design.md,
   "Settings") with the row a device setting uses: who set it from which side, its administrator's control, its
   product's lock, Deprecated. An option of its app's row, so without an icon of its own: its label lines up under the
   app's name. A bool is a switch, a choice a select, an int, a string or a list a field set when it is left; a type
   this portal does not know is shown as it is. A deprecated one with a value set offers Clear below it. */
export const DeviceAppSetting: React.FC<Props> = props => {
  const { t } = useTranslation()
  const { setting, disabled, onClear } = props
  if (!onClear) return <AppSettingControl {...props} />
  return (
    <>
      <AppSettingControl {...props} />
      <ListItem disableGutters dense sx={{ paddingLeft: `${spacing.sm}px`, paddingTop: 0 }}>
        <Button
          size="small"
          disabled={disabled || settingLocked(setting) || setting.control === 'local'}
          onClick={onClear}
          data-app-setting-clear={setting.name}
        >
          {t('deviceApps.clearDeprecated', 'Clear: back to its default')}
        </Button>
      </ListItem>
    </>
  )
}

const AppSettingControl: React.FC<Props> = ({ setting, label, help, disabled, onChange }) => {
  const { t } = useTranslation()
  const deprecated = deprecatedLine(t, setting.deprecated)

  switch (setting.type) {
    case 'bool':
      return (
        <DeviceSettingRow
          setting={setting}
          hideIcon
          disableGutters
          label={label}
          subLabel={help}
          deprecated={setting.deprecated}
          disabled={disabled}
          onChange={onChange}
        />
      )
    case 'choice': {
      const choices = (setting.choices ?? []).map(choice => ({ key: choice.value, name: choice.label }))
      const fixed = choices.some(choice => choice.key === setting.control)
      return (
        <DeviceSettingChoice
          setting={setting}
          hideIcon
          label={label}
          value={fixed ? setting.control : String(setting.value ?? '')}
          choices={choices}
          note={deprecated || help || undefined}
          disabled={disabled}
          onChange={onChange}
        />
      )
    }
    default:
      return <AppSettingField setting={setting} label={label} help={help} disabled={disabled} onChange={onChange} />
  }
}

// A string against its release's rules (app-settings.ts stringValue): at most max characters, and the whole value
// matching its pattern; why not, else none. A pattern this browser cannot read is left to graphql.
export function stringProblem(t: TFunction, value: string, rules?: AppStringRules | null): string | undefined {
  if (!rules) return
  if ([...value].length > rules.max) return t('deviceApps.tooLong', 'At most {{max}} characters', { max: rules.max })
  if (rules.pattern) {
    let pattern: RegExp
    try {
      pattern = new RegExp(`^(?:${rules.pattern})$`, 'u')
    } catch {
      return
    }
    if (!pattern.test(value)) return t('deviceApps.noMatch', 'Must match {{pattern}}', { pattern: rules.pattern })
  }
}

// Why a field's text is not a value of the setting as its release declares it; none when it is.
export function fieldProblem(t: TFunction, setting: Setting, text: string): string | undefined {
  const declared = setting.declaration
  switch (setting.type) {
    case 'int': {
      const number = Number(text)
      if (text.trim() === '' || !Number.isInteger(number)) return t('deviceApps.wholeNumber', 'A whole number')
      if ((declared?.min != null && number < declared.min) || (declared?.max != null && number > declared.max))
        return t('deviceApps.between', 'From {{min}} to {{max}}', { min: declared?.min ?? '…', max: declared?.max ?? '…' })
      return
    }
    case 'string':
      return stringProblem(t, text, declared?.string)
    case 'list': {
      const items = listItems(text)
      if (declared?.maxItems != null && items.length > declared.maxItems)
        return t('deviceApps.tooMany', 'At most {{max}} items', { max: declared.maxItems })
      for (const item of items) {
        const problem = stringProblem(t, item, declared?.item)
        if (problem) return problem
      }
    }
  }
}

const listItems = (text: string) =>
  text
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)

// An int, a string or a list (one item a line): set when the field is left, or Enter pressed in a one-line one — only
// a value its release takes (its bounds, a string's most characters and pattern, a list's most items): another is
// said under the field and not sent.
const AppSettingField: React.FC<Props> = ({ setting, label, help, disabled, onChange }) => {
  const { t } = useTranslation()
  const list = setting.type === 'list'
  const known = ['int', 'string', 'list'].includes(setting.type)
  const shown = (value: any) =>
    list ? (Array.isArray(value) ? value.join('\n') : '') : value === null || value === undefined ? '' : String(value)
  const [text, setText] = useState(shown(setting.value))
  useEffect(() => setText(shown(setting.value)), [setting.value])
  const problem = known && text !== shown(setting.value) ? fieldProblem(t, setting, text) : undefined

  const commit = () => {
    if (text === shown(setting.value) || problem) return
    if (setting.type === 'int') return onChange(Number(text))
    onChange(list ? listItems(text) : text)
  }

  const note = [deprecatedLine(t, setting.deprecated), settingNote(t, setting) || help].filter(Boolean).join(' · ')
  const max = setting.type === 'string' ? setting.declaration?.string?.max : undefined

  return (
    <ListItem disableGutters dense sx={{ paddingLeft: `${spacing.sm}px` }} data-app-setting={setting.name}>
      <TextField
        fullWidth
        variant="standard"
        label={label}
        value={text}
        multiline={list}
        type={setting.type === 'int' ? 'number' : 'text'}
        helperText={problem || note || undefined}
        error={!!problem}
        inputProps={{
          ...(max ? { maxLength: max } : {}),
          ...(setting.type === 'int' && setting.declaration?.min != null ? { min: setting.declaration.min } : {}),
          ...(setting.type === 'int' && setting.declaration?.max != null ? { max: setting.declaration.max } : {}),
          'data-app-setting-input': setting.name,
        }}
        disabled={disabled || settingLocked(setting) || !known}
        onChange={event => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter' && !list) commit()
        }}
      />
    </ListItem>
  )
}
