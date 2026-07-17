import React from 'react'
import reactStringReplace from 'react-string-replace'
import escapeRegexp from 'escape-string-regexp'
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
import { REGEX_TAG_SAFE } from '../constants'
import { tagsInclude } from '../helpers/utilHelper'
import { Icon } from './Icon'

interface Props {
  open: boolean
  items: ITag[]
  filter?: ITag[]
  targetEl: Element | null
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
    <Popper
      open={open}
      anchorEl={targetEl}
      placement="bottom-start"
      modifiers={[
        {
          name: 'flip',
          enabled: true,
          options: {
            altBoundary: true,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            altAxis: true,
            altBoundary: true,
            tether: false,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
      ]}
    >
      <Paper
        elevation={1}
        sx={{
          minWidth: 200,
          backgroundColor: 'grayLightest.main',
          '& .MuiAutocomplete-root .MuiFilledInput-root': { padding: 0 },
        }}
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
          sx={theme => ({
            '& .MuiAutocomplete-popper': { width: '100%', position: 'relative' },
            '& .MuiAutocomplete-paper': { borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none' },
            '& .MuiAutocomplete-listbox': {
              paddingTop: `${spacing.xxs}px`,
              paddingBottom: `${spacing.xxs}px`,
              backgroundColor: theme.palette.grayLightest.main,
            },
            '& .MuiAutocomplete-noOptions': { display: 'none' },
            '& .MuiAutocomplete-option': {
              borderRadius: `${radius.sm}px`,
              marginLeft: `${spacing.xs}px`,
              marginRight: `${spacing.xs}px`,
              marginBottom: '1px',
              paddingLeft: '2px',
              paddingRight: '2px',
              minHeight: 20,
              color: theme.palette.grayDarker.main,
              '&.Mui-focused': { backgroundColor: theme.palette.primaryHighlight.main },
              '&.Mui-selected': { backgroundColor: theme.palette.primaryHighlight.main },
              '& .MuiListItemText-primary': { fontSize: fontSizes.sm },
              '& .MuiListItemIcon-root': { minWidth: 40 },
            },
          })}
          onClose={onClose}
          onChange={(_event, value) => {
            if (!value || !onSelect || disabled) return
            if (value.created) onSelect('add', value)
            else onSelect('new', { name: inputValue, color: value.color, created: new Date() })
          }}
          isOptionEqualToValue={(option, value) => option.name === value.name || !option.created}
          PopperComponent={BoxComponent}
          noOptionsText={false}
          getOptionLabel={option => option.name || ''}
          onInputChange={(_event, newValue) => {
            const result = newValue.replace(REGEX_TAG_SAFE, '')
            setInputValue(result)
            if (onChange) onChange(result)
          }}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option.name}>
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
                    <Box component="span" key={i} sx={{ color: 'primary.main', fontWeight: 500 }}>
                      {match}
                    </Box>
                  )
                )}
              />
            </MenuItem>
          )}
          renderInput={params => (
            <TextField
              {...params}
              autoFocus
              variant="filled"
              sx={theme => ({
                margin: 0,
                padding: `${spacing.xs}px ${spacing.xs}px 0`,
                '& .MuiFilledInput-input.MuiAutocomplete-input': {
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  fontSize: fontSizes.base,
                  color: theme.palette.grayDarkest.main,
                },
              })}
              InputProps={{ ...params.InputProps, ...InputProps }}
              placeholder={placeholder}
            />
          )}
        />
      </Paper>
    </Popper>
  )
}

type BoxProps = Omit<PopperProps, 'anchorEL' | 'open' | 'role' | 'disablePortal' | 'style'>

export const BoxComponent: React.FC<BoxProps> = ({ className, children, placement }) => (
  <Box className={className}>
    {typeof children === 'function' ? children({ placement: placement || 'auto' }) : children}
  </Box>
)

