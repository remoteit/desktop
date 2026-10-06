import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* AI commands (graphql-api docs/mcp/EXEC.md, "The local override"): whether commands an AI runs through remote.it's
   MCP server may use the device's console. A device setting, mcp_exec (device-package docs/device-settings.md): the
   console refuses their certificates while it is off, a person's own terminal unaffected. With the console's row, and
   absent where the API's device settings do not have it. */
export const DeviceMcpExecSetting: React.FC<{ settings: DeviceSettings; canManage: boolean }> = ({
  settings,
  canManage,
}) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const mcpExec = settings.setting('mcp_exec')

  if (!mcpExec) return null

  return (
    <DeviceSettingRow
      setting={mcpExec}
      icon="remote-ai"
      label={t('deviceMcpExec.label', 'AI commands')}
      subLabel={t(
        'deviceMcpExec.hint',
        "Let AI assistants you authorize run commands on this device's console through remote.it's MCP server. The device's administrator can turn this off on the machine."
      )}
      disabled={saving || !canManage}
      disableGutters
      onChange={async on => {
        setSaving(true)
        await settings.set('mcp_exec', on)
        setSaving(false)
      }}
    />
  )
}
