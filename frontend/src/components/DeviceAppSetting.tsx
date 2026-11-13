import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ListItem, TextField } from '@mui/material'
import { DeviceAppSetting as Setting } from '../services/graphQLDeviceApps'
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

// An int, a string or a list (one item a line): set when the field is left, or Enter pressed in a one-line one.
const AppSettingField: React.FC<Props> = ({ setting, label, help, disabled, onChange }) => {
  const { t } = useTranslation()
  const list = setting.type === 'list'
  const known = ['int', 'string', 'list'].includes(setting.type)
  const shown = (value: any) =>
    list ? (Array.isArray(value) ? value.join('\n') : '') : value === null || value === undefined ? '' : String(value)
  const [text, setText] = useState(shown(setting.value))
  useEffect(() => setText(shown(setting.value)), [setting.value])

  const commit = () => {
    if (text === shown(setting.value)) return
    if (setting.type === 'int') {
      const number = Number(text)
      if (text.trim() === '' || !Number.isInteger(number)) return setText(shown(setting.value))
      return onChange(number)
    }
    onChange(
      list
        ? text
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean)
        : text
    )
  }

  const note = [deprecatedLine(t, setting.deprecated), settingNote(t, setting) || help].filter(Boolean).join(' · ')

  return (
    <ListItem disableGutters dense sx={{ paddingLeft: `${spacing.sm}px` }} data-app-setting={setting.name}>
      <TextField
        fullWidth
        variant="standard"
        size="small"
        label={label}
        value={text}
        multiline={list}
        type={setting.type === 'int' ? 'number' : 'text'}
        helperText={note || undefined}
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
