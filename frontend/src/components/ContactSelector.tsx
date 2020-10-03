import React from 'react'
import CreatableSelect from 'react-select/creatable'
import { Theme } from 'react-select'
import { makeStyles } from '@material-ui/core'
import { contactOptions } from '../helpers/contacts'
import { colors, spacing, fontSizes } from '../styling'
import { Typography, Link } from '@material-ui/core'

type Props = {
  selected?: IUser[]
  contacts: IUserRef[]
  onChange: (emails: string[]) => void
}

export const ContactSelector: React.FC<Props> = ({ selected = [], contacts, onChange }) => {
  const options = contactOptions(contacts, selected)
  const css = useStyles()

  const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

  const handleChange = (opts?: any) => {
    opts = opts?.length ? opts : []
    onChange(opts.map((r: IReactSelectOption) => r.value))
  }

  const validateEmail = (inputValue: string) => {
    return (
      mailFormat.test(inputValue) && (
        <Typography variant="body2" color="textSecondary">
          Share to <Link>{inputValue}</Link>
        </Typography>
      )
    )
  }

  return (
    <CreatableSelect
      isMulti
      isClearable
      options={options}
      theme={selectTheme}
      className={css.select}
      classNamePrefix="select"
      placeholder="Enter an email..."
      onChange={handleChange}
      isValidNewOption={v => mailFormat.test(v)}
      formatCreateLabel={validateEmail}
      styles={customStyles}
    />
  )
}

const useStyles = makeStyles({
  select: {
    flexGrow: 1,
    margin: `${spacing.md}px 0`,
    fontSize: fontSizes.md,
    '& .select__placeholder': { color: colors.primary },
    '& .select__multi-value': { backgroundColor: colors.primary, padding: `${spacing.xxs}px ${spacing.xs}px` },
    '& .select__multi-value__label': { fontSize: fontSizes.base, fontWeight: 500, color: colors.white },
    '& .select__multi-value__remove': { color: colors.white },
  },
})

const selectTheme = (theme: Theme) => {
  return {
    ...theme,
    borderRadius: spacing.xs,
    colors: {
      ...theme.colors,
      primary25: colors.primaryHighlight,
      primary: colors.primary,
    },
  }
}

const customStyles = {
  option: (styles: any) => ({ ...styles, cursor: 'pointer' }),
  control: (styles: any) => ({ ...styles, cursor: 'pointer' }),
}
