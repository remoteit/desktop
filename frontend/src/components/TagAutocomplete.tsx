import React from 'react'
import reactStringReplace from 'react-string-replace'
import escapeRegexp from 'escape-string-regexp'
import { makeStyles } from '@mui/styles'
import {
  Box,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Popover,
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

  if (!targetEl) return null

  return (
    <Popover
      PaperProps={{ className: css.inputContainer }}
      elevation={1}
      anchorEl={targetEl}
      open={open}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
    >
      <Autocomplete
        open
        fullWidth
        disablePortal
        autoHighlight
        handleHomeEndKeys
        options={options}
        includeInputInList
        inputValue={inputValue}
        classes={{
          listbox: css.listbox,
          option: css.option,
          popper: css.popper,
          paper: css.popperPaper,
          noOptions: css.empty,
        }}
        onClose={onClose}
        onChange={(event, value, reason) => {
          if (!value || !onSelect || disabled) return
          if (value.created) onSelect('add', value)
          else onSelect('new', { name: inputValue, color: value.color, created: new Date() })
        }}
        isOptionEqualToValue={(option, value) => option.name === value.name || !option.created}
        PopperComponent={BoxComponent}
        noOptionsText={false}
        getOptionLabel={option => option.name || ''}
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
              primary={reactStringReplace(option.name, new RegExp(`(${escapeRegexp(inputValue)})`, 'i'), (match, i) => (
                <span key={i} className={css.spanItem}>
                  {match}
                </span>
              ))}
            />
          </MenuItem>
        )}
        renderInput={params => (
          <TextField
            {...params}
            autoFocus
            variant="filled"
            className={css.input}
            InputProps={{ ...params.InputProps, ...InputProps }}
            placeholder={placeholder}
          />
        )}
      />
    </Popover>
  )
}

type BoxProps = Omit<PopperProps, 'anchorEL' | 'open' | 'role' | 'disablePortal' | 'style'>

export const BoxComponent: React.FC<BoxProps> = ({ className, children, placement }) => (
  <Box className={className}>
    {typeof children === 'function' ? children({ placement: placement || 'auto' }) : children}
  </Box>
)

const useStyles = makeStyles(({ palette }) => ({
  inputContainer: {
    minWidth: 200,
    overflow: 'visible',
    backgroundColor: palette.grayLightest.main,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    '& .MuiAutocomplete-root .MuiFilledInput-root': { padding: 0 },
  },
  input: {
    margin: 0,
    padding: `${spacing.xs}px ${spacing.xs}px 0`,
    '& .MuiFilledInput-input.MuiAutocomplete-input': {
      padding: `${spacing.xs}px ${spacing.sm}px`,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
    },
  },
  popper: {
    width: '100%',
  },
  popperPaper: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  listbox: {
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs,
    backgroundColor: palette.grayLightest.main,
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
