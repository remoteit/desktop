import React from 'react'
import reactStringReplace from 'react-string-replace'
import escapeRegexp from 'escape-string-regexp'
import { makeStyles } from '@mui/styles'
import {
  Box,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  PopperProps,
  TextField,
  TextFieldProps,
  Autocomplete,
} from '@mui/material'
import { spacing, radius, fontSizes } from '../styling'
import { REGEX_TAG_SAFE } from '../shared/constants'
import { tagsInclude } from '../helpers/utilHelper'
import { Icon } from './Icon'

interface Props {
  open: boolean
  items: ITag[]
  filter?: ITag[]
  targetEl: HTMLDivElement | null
  placeholder: string
  allowAdding?: boolean
  createOnly?: boolean
  indicator?: string
  hideIcons?: boolean
  InputProps?: TextFieldProps['InputProps']
  onItemColor?: (value: ITag) => string
  onSelect?: (action: 'add' | 'new', value: ITag) => void
  onChange?: (value?: string) => void
  onClose?: () => void
}

export const TagAutocomplete: React.FC<Props> = ({
  open,
  items,
  filter = [],
  placeholder,
  indicator,
  targetEl,
  onItemColor,
  onSelect,
  onChange,
  onClose,
  hideIcons,
  allowAdding,
  createOnly,
  InputProps = {},
}) => {
  const [inputValue, setInputValue] = React.useState<string>('')
  const css = useStyles()
  const matched = tagsInclude(items, inputValue)
  items = createOnly ? [] : items.filter(i => !tagsInclude(filter, i.name))
  const exists = tagsInclude(filter, inputValue)
  const disabled = (createOnly && matched) || exists
  const options = exists
    ? items.concat({
        name: `${inputValue} already tagged`,
        color: 0,
      })
    : disabled
    ? items.concat({
        name: `${inputValue} already exists`,
        color: 0,
      })
    : allowAdding && inputValue.length && !matched
    ? items.concat({
        name: `Add: ${inputValue}`,
        color: 0,
      })
    : items

  return (
    <Popper anchorEl={targetEl} open={open} placement="bottom-start">
      <Paper className={css.container} elevation={1}>
        <Autocomplete
          fullWidth
          open={true}
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
            if (!value || !onSelect || disabled) return
            if (value.created) onSelect('add', value)
            else onSelect('new', { name: inputValue, color: value.color, created: new Date() })
          }}
          PaperComponent={Box as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          PopperComponent={Box as React.ComponentType<PopperProps>}
          noOptionsText={false}
          getOptionLabel={option => option.name}
          onInputChange={(event, newValue) => {
            const result = newValue.replace(REGEX_TAG_SAFE, '')
            setInputValue(result)
            if (onChange) onChange(result)
          }}
          renderOption={(props, option) => (
            <MenuItem {...props}>
              {hideIcons ? (
                <> &nbsp; &nbsp; </>
              ) : (
                <ListItemIcon>
                  <Icon
                    name={!option.name ? 'plus' : indicator || 'circle'}
                    color={!option.name ? undefined : onItemColor ? onItemColor(option) : undefined}
                    type="solid"
                    size="base"
                  />
                </ListItemIcon>
              )}
              <ListItemText
                primary={reactStringReplace(
                  option.name,
                  new RegExp(`(${escapeRegexp(inputValue)})`, 'i'),
                  (match, i) => (
                    <span key={i} className={css.spanItem}>
                      {match}
                    </span>
                  )
                )}
              />
            </MenuItem>
          )}
          renderInput={params => (
            <TextField
              autoFocus
              fullWidth
              variant="filled"
              ref={params.InputProps.ref}
              inputProps={params.inputProps}
              className={css.textField}
              InputProps={InputProps}
              placeholder={placeholder}
            />
          )}
        />
      </Paper>
    </Popper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    width: 200,
    backgroundColor: palette.grayLightest.main,
    '& .MuiAutocomplete-root .MuiFilledInput-root': { padding: 0 },
  },
  listbox: { paddingTop: 0 },
  textField: { padding: `${spacing.xs}px ${spacing.xs}px 0` },
  input: {
    '&.MuiFilledInput-input.MuiAutocomplete-input': {
      padding: `${spacing.xs}px ${spacing.sm}px`,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
    },
  },
  popperDisablePortal: {
    position: 'relative',
  },
  empty: {
    display: 'none',
  },
  spanItem: {
    color: palette.primary.main,
    fontWeight: 500,
  },
  option: {
    '&.MuiAutocomplete-option': {
      borderRadius: radius,
      marginLeft: spacing.xs,
      marginRight: spacing.xs,
      marginBottom: 1,
      paddingLeft: 2,
      paddingRight: 2,
      color: palette.grayDarker.main,
      '&.Mui-focused': { backgroundColor: palette.primaryHighlight.main },
      '&.Mui-selected': { backgroundColor: palette.primaryHighlight.main },
      '& .MuiListItemText-primary': { fontSize: fontSizes.sm },
      '& .MuiListItemIcon-root': { minWidth: 40 },
    },
  },
}))
