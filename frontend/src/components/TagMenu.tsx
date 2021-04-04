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
import reactStringReplace from 'react-string-replace'
import { ApplicationState } from '../store'
import { Autocomplete } from '@material-ui/lab'
import {
  makeStyles,
  Button,
  Box,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  TextField,
} from '@material-ui/core'
import { spacing, colors, radius, fontSizes } from '../styling'
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
  const [inputValue, setInputValue] = React.useState<string>('')
  const [el, setEl] = React.useState<HTMLButtonElement | null>()
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const css = useStyles()

  const handleClose = event => {
    setEl(null)
    console.log(inputValue, 'close event:', event.target.value)
  }
  const handleOpen = () => setEl(el ? null : buttonRef.current)

  const handleSelect = (action: 'add' | 'new', value: ILabel) => {
    console.log(action, value)
  }

  const options =
    inputValue.length && !tags.find(t => t.name === inputValue)
      ? tags.concat({
          name: `Add tag: ${inputValue}`,
          id: -1,
          color: '',
        })
      : tags

  if (!device) return null

  return (
    <>
      <Button variant="text" size="small" onClick={handleOpen} ref={buttonRef}>
        <Icon name="plus" size="sm" inlineLeft />
        add tag
      </Button>
      <Popper anchorEl={el} open={Boolean(el)} placement="bottom-start">
        <Paper className={css.container} elevation={1}>
          <Autocomplete
            open
            fullWidth
            disablePortal
            autoHighlight
            options={options}
            includeInputInList
            inputValue={inputValue}
            classes={{
              listbox: css.listbox,
              option: css.option,
              input: css.input,
              popperDisablePortal: css.popperDisablePortal,
            }}
            onClose={handleClose}
            onChange={(event, value, reason) => {
              if (!value) return
              if (value.id === -1) handleSelect('new', { color: '', name: inputValue, id: -1 })
              else handleSelect('add', value)
            }}
            PaperComponent={Box as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
            noOptionsText={false}
            getOptionLabel={option => option.name}
            onInputChange={(event, newValue) => setInputValue(newValue.replace(REGEX_TAG_SAFE, ''))}
            renderOption={option => (
              <>
                <ListItemIcon>
                  <Icon name={option.id === -1 ? 'plus' : 'circle'} color={option.color} type="solid" />
                </ListItemIcon>
                <ListItemText
                  primary={reactStringReplace(option.name, new RegExp(`(${inputValue})`, 'i'), (match, i) => (
                    <span key={i} style={{ color: colors.primary }}>
                      {match}
                    </span>
                  ))}
                />
              </>
            )}
            renderInput={params => (
              <TextField
                ref={params.InputProps.ref}
                inputProps={params.inputProps}
                className={css.textField}
                autoFocus
                size="small"
                variant="filled"
                placeholder="Add tag..."
              />
            )}
          />
        </Paper>
      </Popper>
    </>
  )
}

const useStyles = makeStyles({
  container: { width: 200 },
  listbox: { shadow: 'none', paddingTop: 0 },
  textField: { width: '100%', padding: `${spacing.xs}px ${spacing.xs}px 0` },
  input: {
    width: '100%',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: fontSizes.base,
    color: colors.grayDarkest,
  },
  popperDisablePortal: {
    position: 'relative',
  },
  option: {
    borderRadius: radius,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: 1,
    padding: `${spacing.xxs}px ${spacing.xs}px`,
    color: colors.grayDarker,
    '&[data-focus="true"]': { backgroundColor: colors.primaryHighlight },
    '&[aria-selected="true"]': { backgroundColor: colors.primaryHighlight },
    '& .MuiListItemText-primary': { fontSize: fontSizes.base },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
})
