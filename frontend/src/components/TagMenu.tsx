import React from 'react'
import { isDev } from '../services/Browser'
import { useHistory } from 'react-router-dom'
import { useClipboard } from 'use-clipboard-copy'
import { useSelector } from 'react-redux'
import { CopyButton } from '../buttons/CopyButton'
import { getDevices } from '../models/accounts'
import { findService } from '../models/devices'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { ApplicationState } from '../store'
import {
  makeStyles,
  Button,
  Typography,
  Menu,
  MenuItem,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@material-ui/core'
import { spacing, colors } from '../styling'
import { Icon } from './Icon'

interface Props {
  device: IDevice
}

export const REGEX_TAG_SAFE = /[^a-zA-Z0-9-]/g

// interface ITag {
//   id: number
//   name: string
//   color: ILabel['id']
// }

export const TagMenu: React.FC<Props> = ({ device }) => {
  const tags = useSelector((state: ApplicationState) => state.labels)
  const [editValue, setEditValue] = React.useState<string | number>('')
  const [el, setEl] = React.useState<HTMLButtonElement | null>()
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  if (!device) return null

  const handleClose = () => setEl(null)
  const handleOpen = () => setEl(buttonRef.current)

  return (
    <>
      <Button variant="text" size="small" onClick={handleOpen} ref={buttonRef}>
        <Icon name="plus" size="sm" inlineLeft />
        add tag
      </Button>
      <Menu
        open={Boolean(el)}
        anchorEl={el}
        className={css.menu}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        elevation={2}
      >
        <MenuItem onFocus={() => inputRef.current?.focus()} dense>
          <TextField
            autoFocus
            inputRef={inputRef}
            value={editValue}
            variant="filled"
            placeholder="Add tag..."
            focused={true}
            onKeyDown={event => {
              console.log('keydown', event.key, event.key.length)
              if (event.key.length < 2) event.stopPropagation()
            }}
            onChange={event => {
              let { value } = event.target
              value = value.replace(REGEX_TAG_SAFE, '')
              setEditValue(value)
            }}
          />
        </MenuItem>
        {tags.map(
          tag =>
            (!editValue || tag.name.toLowerCase().includes(editValue.toString().toLowerCase())) && (
              <MenuItem dense>
                <ListItemIcon>
                  <Icon name="circle" color={tag.color} type="solid" />
                </ListItemIcon>
                <ListItemText primary={tag.name} />
              </MenuItem>
            )
        )}
      </Menu>
    </>
  )
}

const useStyles = makeStyles({
  menu: {
    '& .MuiMenuItem-root': {
      // paddingLeft: 0,
      // paddingRight: spacing.lg,
    },
  },
})
