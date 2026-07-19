import React from 'react'
import isEmail from 'validator/lib/isEmail'
import CreatableSelect from 'react-select/creatable'
import { Theme } from 'react-select'
import { spacing, fontSizes } from '../styling'
import { Box, Typography, Link } from '@mui/material'

interface Option {
  readonly label: string
  readonly value: string
}

type Props = {
  isMulti?: boolean
  contacts: IUserRef[]
  selected: string[]
  onSelect: (emails: string[]) => void
}

export const ContactSelector: React.FC<Props> = ({ contacts, selected, onSelect, isMulti = true }) => {
  const [inputValue, setInputValue] = React.useState<string>()
  const options: Option[] = contacts.map(c => ({ value: c.email, label: c.email }))
  const uniqueSelected = [...Array.from(new Set(selected))]
  const value: Option[] = uniqueSelected.map(s => ({ value: s.trim(), label: s.trim() }))

  const labelComponent = (inputValue: string) => (
    <Typography variant="body2" color="textSecondary">
      Add <Link>{inputValue}</Link>
    </Typography>
  )

  return (
    <Box
      sx={theme => ({
        flexGrow: 1,
        margin: `${spacing.md}px 0`,
        fontSize: fontSizes.base,
        width: '100%',
        fontWeight: 400,
        '& .select__placeholder': { color: theme.palette.primary.main },
        '& .select__multi-value': {
          backgroundColor: theme.palette.primary.main,
          padding: `${spacing.xxs}px ${spacing.xs}px`,
        },
        '& .select__multi-value__label': {
          fontSize: fontSizes.base,
          fontWeight: 500,
          color: theme.palette.alwaysWhite.main,
        },
        '& .select__multi-value__remove': { color: theme.palette.white.main },
        '& .select__control': { backgroundColor: theme.palette.white.main, borderColor: theme.palette.primary.main },
        '& .select__input': { color: `${theme.palette.grayDarkest.main} !important` },
        '& .select__menu': { backgroundColor: theme.palette.grayLightest.main },
        '& .select__option:active': { backgroundColor: theme.palette.primary.main },
        '& .select__option--is-focused': { backgroundColor: theme.palette.primaryHighlight.main },
        '& .select__single-value': {
          backgroundColor: theme.palette.primary.main,
          padding: `${spacing.xxs}px ${spacing.sm}px ${spacing.xxs}px ${spacing.sm}px`,
          fontSize: fontSizes.base,
          fontWeight: 500,
          color: theme.palette.white.main,
          borderRadius: `${spacing.xxs}px`,
        },
      })}
    >
      <CreatableSelect
        // menuIsOpen // debug
        autoFocus
        isClearable
        value={value}
        inputValue={inputValue}
        isMulti={isMulti}
        options={options}
        theme={selectTheme}
        classNamePrefix="select"
        placeholder={isMulti ? 'Enter or paste a list of emails...' : 'Enter or paste an email...'}
        onChange={options => {
          const result: string[] = Array.isArray(options)
            ? options.map(o => o.value.trim())
            : options
            ? // @ts-ignore
              [options.value.trim()]
            : []
          onSelect(result)
        }}
        isValidNewOption={o => isEmail(o.trim())}
        onInputChange={v => {
          const parts = v.trim().split(/[, ]+/)
          const emails = parts.filter(p => isEmail(p))
          if (emails.length > 1) {
            onSelect([...selected, ...emails])
            setInputValue('')
          } else {
            setInputValue(v)
          }
        }}
        formatCreateLabel={labelComponent}
        styles={customStyles}
      />
    </Box>
  )
}

const selectTheme = (theme: Theme) => {
  return {
    ...theme,
    borderRadius: spacing.xs,
    colors: {
      ...theme.colors,
      primary: theme.colors.primary,
    },
  }
}

const customStyles = {
  option: (styles: any) => ({ ...styles, cursor: 'pointer' }),
  control: (styles: any) => ({ ...styles, cursor: 'pointer' }),
}
