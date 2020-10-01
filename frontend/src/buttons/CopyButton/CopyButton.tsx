import React, { useState } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { useApplication } from '../../shared/applications'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from '../../components/Icon'
import { FontSize } from '../../styling'
import { setConnection } from '../../helpers/connectionHelper'
import { ModalSetUsername } from '../../components/ModalSetUsername'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, service, menuItem, size = 'md' }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(service && service.typeID)

  const [username, setUsername] = useState<string>((connection && connection.username) || '')
  const [openUsername, setOpenUsername] = useState<boolean>(false)
  if (!connection || !connection.active || !app) return null

  const check = () => {
    app.prompt && (connection.username === '' || connection.username === undefined)
      ? setOpenUsername(true)
      : clipboard.copy()
  }
  const close = () => {
    setOpenUsername(false)
  }

  const handleSubmit = () => {
    if (username) {
      setConnection({ ...connection, username: username.toString() })
      setTimeout(function () {
        clipboard.copy()
        close()
      }, 500)
    }
  }

  const CopyIcon = (
    <>
      <Icon
        name={clipboard.copied ? 'check' : 'clipboard'}
        color={clipboard.copied ? 'success' : undefined}
        size={size}
        fixedWidth
      />
      <input type="hidden" ref={clipboard.target} value={app.copy(connection)} />
    </>
  )
  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={check}>
          <ListItemIcon>{CopyIcon}</ListItemIcon>
          <ListItemText primary={clipboard.copied ? 'Copied!' : 'Copy connection'} />
        </MenuItem>
      ) : (
        <Tooltip title={clipboard.copied ? 'Copied!' : 'Copy connection'}>
          <IconButton onClick={check}>{CopyIcon}</IconButton>
        </Tooltip>
      )}

      <ModalSetUsername
        connection={connection}
        openUsername={openUsername}
        handleSubmit={handleSubmit}
        username={username}
        setUsername={setUsername}
        service={service}
        close={close}
      />
    </>
  )
}
