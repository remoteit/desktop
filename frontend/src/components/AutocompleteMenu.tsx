import React from 'react'
import reactStringReplace from 'react-string-replace'
import { Autocomplete } from '@material-ui/lab'
import {
  makeStyles,
  Box,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  TextField,
  TextFieldProps,
} from '@material-ui/core'
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
  InputProps?: TextFieldProps['InputProps']
  onItemColor?: (value: ITag) => string
  onSelect?: (action: 'add' | 'new', value: ITag) => void
  onChange?: (value?: string) => void
  onClose?: () => void
}

export const AutocompleteMenu: React.FC<Props> = ({
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
            if (!value.created) onSelect('new', { name: inputValue, color: value.color, created: new Date() })
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
                  name={!option.name ? 'plus' : indicator || 'circle'}
                  color={!option.name ? undefined : onItemColor ? onItemColor(option) : undefined}
                  type="solid"
                  size="base"
                />
              </ListItemIcon>
              <ListItemText
                primary={reactStringReplace(option.name, new RegExp(`(${inputValue})`, 'i'), (match, i) => (
                  <span key={i} className={css.spanItem}>
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
              InputProps={InputProps}
              autoFocus
              variant="filled"
              placeholder={placeholder}
            />
          )}
        />
      </Paper>
    </Popper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: { width: 200 },
  listbox: { shadow: 'none', paddingTop: 0 },
  textField: { width: '100%', padding: `${spacing.xs}px ${spacing.xs}px 0` },
  input: {
    width: '100%',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: fontSizes.base,
    color: palette.grayDarkest.main,
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
    borderRadius: radius,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: 1,
    padding: `2px ${spacing.xxs}px`,
    color: palette.grayDarker.main,
    '&[data-focus="true"]': { backgroundColor: palette.primaryHighlight.main },
    '&[aria-selected="true"]': { backgroundColor: palette.primaryHighlight.main },
    '& .MuiListItemText-primary': { fontSize: fontSizes.sm },
    '& .MuiListItemIcon-root': { minWidth: 40 },
  },
}))
