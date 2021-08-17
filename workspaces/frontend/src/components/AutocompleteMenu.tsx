import React from 'react'
import reactStringReplace from 'react-string-replace'
import { Autocomplete } from '@material-ui/lab'
import { makeStyles, Box, ListItemIcon, ListItemText, Paper, Popper, TextField } from '@material-ui/core'
import { spacing, colors, radius, fontSizes } from '../styling'
import { REGEX_TAG_SAFE } from '../shared/constants'
import { Icon } from './Icon'

interface Props {
  open: boolean
  items: ITag[]
  targetEl: HTMLDivElement | null
  placeholder: string
  allowAdding?: boolean
  indicator?: string
  onItemColor?: (value: ITag) => string
  onSelect?: (action: 'add' | 'new', value: ITag) => void
  onChange?: (value?: string) => void
  onClose?: () => void
}

export const AutocompleteMenu: React.FC<Props> = ({
  open,
  items,
  placeholder,
  indicator,
  targetEl,
  onItemColor,
  onSelect,
  onChange,
  onClose,
  allowAdding,
}) => {
  const [inputValue, setInputValue] = React.useState<string>('')
  const css = useStyles()

  const options =
    allowAdding && inputValue.length && !items.find(t => t.name === inputValue)
      ? items.concat({
          name: `Add tag: ${inputValue}`,
          id: -1,
        })
      : items

  return (
    <Popper anchorEl={targetEl} open={open} placement="bottom-start">
      <Paper className={css.container} elevation={1}>
        <Autocomplete
          open={true}
          debug={true}
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
            noOptions: css.empty,
          }}
          onClose={onClose}
          onChange={(event, value, reason) => {
            if (!value || !onSelect) return
            if (value.id === -1) onSelect('new', { name: inputValue, id: -1 })
            else onSelect('add', value)
          }}
          PaperComponent={Box as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          noOptionsText={false}
          getOptionLabel={option => option.name}
          onInputChange={(event, newValue) => {
            const result = newValue.replace(REGEX_TAG_SAFE, '')
            setInputValue(result)
            if (onChange) onChange(result)
          }}
          renderOption={option => (
            <>
              <ListItemIcon>
                <Icon
                  name={option.id === -1 ? 'plus' : indicator || 'circle'}
                  color={option.id === -1 ? undefined : onItemColor ? onItemColor(option) : undefined}
                  type="solid"
                  size="base"
                />
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
              placeholder={placeholder}
            />
          )}
        />
      </Paper>
    </Popper>
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
  empty: {
    display: 'none',
  },
  option: {
    borderRadius: radius,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: 1,
    padding: `${2}px ${spacing.xxs}px`,
    color: colors.grayDarker,
    '&[data-focus="true"]': { backgroundColor: colors.primaryHighlight },
    '&[aria-selected="true"]': { backgroundColor: colors.primaryHighlight },
    '& .MuiListItemText-primary': { fontSize: fontSizes.sm },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
})
