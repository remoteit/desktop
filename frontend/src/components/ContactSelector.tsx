import React from 'react'
import CreatableSelect from 'react-select/creatable'
import { Theme } from 'react-select'
import { makeStyles } from '@material-ui/core'
import { contactOptions } from '../helpers/contacts'
import { spacing, fontSizes } from '../styling'
import { Typography, Link } from '@material-ui/core'

type Props = {
  selected?: IUser[]
  contacts: IUserRef[]
  onChange: (emails: string[]) => void
  isTransfer?: boolean
}

export const ContactSelector: React.FC<Props> = ({ selected = [], contacts, onChange, isTransfer = false }) => {
  const options = contactOptions(contacts, selected)
  const css = useStyles()

  const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/

  const handleChange = (opts?: any) => {
    if (!isTransfer) {
      opts = opts?.length ? opts : []
      onChange(opts.map((r: IReactSelectOption) => r.value))
    } else {
      opts = opts?.value ? [opts.value] : []
      onChange(opts)
    }
  }

  const validateEmail = (inputValue: string) => {
    return (
      mailFormat.test(inputValue) && (
        <Typography variant="body2" color="textSecondary">
          Add <Link>{inputValue}</Link>
        </Typography>
      )
    )
  }

  return (
    <CreatableSelect
      isMulti={!isTransfer}
      autoFocus
      isClearable
      options={options}
      theme={selectTheme}
      className={css.select}
      classNamePrefix="select"
      placeholder={isTransfer ? 'Enter new device owner...' : 'Enter an email...'}
      onChange={handleChange}
      isValidNewOption={v => mailFormat.test(v)}
      formatCreateLabel={validateEmail}
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
    '& .select__multi-value__label': { fontSize: fontSizes.base, fontWeight: 500, color: palette.white.main },
    '& .select__multi-value__remove': { color: palette.white.main },
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
      primary25: theme.colors.primaryHighlight,
      primary: theme.colors.primary,
    },
  }
}

const customStyles = {
  option: (styles: any) => ({ ...styles, cursor: 'pointer' }),
  control: (styles: any) => ({ ...styles, cursor: 'pointer' }),
}
