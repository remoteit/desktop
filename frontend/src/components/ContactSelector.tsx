import React from 'react'
import isEmail from 'validator/lib/isEmail'
import CreatableSelect from 'react-select/creatable'
import { Theme } from 'react-select'
import { makeStyles } from '@mui/styles'
import { spacing, fontSizes } from '../styling'
import { Typography, Link } from '@mui/material'

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
  const css = useStyles()

  const labelComponent = (inputValue: string) => (
    <Typography variant="body2" color="textSecondary">
      Add <Link>{inputValue}</Link>
    </Typography>
  )

  return (
    <CreatableSelect
      // menuIsOpen // debug
      autoFocus
      isClearable
      value={value}
      inputValue={inputValue}
      isMulti={isMulti}
      options={options}
      theme={selectTheme}
      className={css.select}
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
  )
}

const useStyles = makeStyles(({ palette }) => ({
  select: {
    flexGrow: 1,
    margin: `${spacing.md}px 0`,
    fontSize: fontSizes.base,
    width: '100%',
    fontWeight: 400,
    '& .select__placeholder': { color: palette.primary.main },
    '& .select__multi-value': { backgroundColor: palette.primary.main, padding: `${spacing.xxs}px ${spacing.xs}px` },
    '& .select__multi-value__label': { fontSize: fontSizes.base, fontWeight: 500, color: palette.alwaysWhite.main },
    '& .select__multi-value__remove': { color: palette.white.main },
    '& .select__control': { backgroundColor: palette.white.main, borderColor: palette.primary.main },
    '& .select__input': { color: `${palette.grayDarkest.main} !important` },
    '& .select__menu': { backgroundColor: palette.grayLightest.main },
    '& .select__option:active': { backgroundColor: palette.primary.main },
    '& .select__option--is-focused': { backgroundColor: palette.primaryHighlight.main },
    '& .select__single-value': {
      backgroundColor: palette.primary.main,
      padding: `${spacing.xxs}px ${spacing.sm}px ${spacing.xxs}px ${spacing.sm}px`,
      fontSize: fontSizes.base,
      fontWeight: 500,
      color: palette.white.main,
      borderRadius: `${spacing.xxs}px`,
    },
  },
}))

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
