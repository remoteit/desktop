import React from 'react'
import { Theme } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { makeStyles } from '@material-ui/core'
import { generateContactOptions } from '../../models/contacts'
import { ApplicationState } from '../../store'
import { useSelector } from '../../hooks/reactReduxHooks'
import { IContact } from 'remote.it'
import { colors, spacing, fontSizes } from '../../styling'
import { Typography, Link } from '@material-ui/core'

export function DeviceShareAdd({
  contacts,
  onChangeContacts,
  selectedContacts,
}: {
  contacts: IContact[]
  onChangeContacts: (contacts: string[]) => void
  selectedContacts: string[]
}): JSX.Element {
  function handleContactChange(contacts: string[]): void {
    onChangeContacts(contacts)
  }
  return <ContactSelector contacts={contacts} onChange={handleContactChange} selectedContacts={selectedContacts} />
}

function ContactSelector({
  contacts,
  onChange,
  selectedContacts = [],
}: {
  contacts: IContact[]
  onChange: (latest: any) => void
  selectedContacts?: string[]
}): JSX.Element {
  const [devices] = useSelector((state: ApplicationState) => state.devices.all)
  const options = generateContactOptions(contacts.filter(o => o.email !== devices.owner))
  const css = useStyles()

  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

  const handleChange = (opts: any, actionMeta: any): void => {
    opts = opts && opts.length ? opts : []
    onChange(opts.map((o: any) => o.value))
  }

  const validateEmail = (inputValue: any) => {
    return mailformat.test(inputValue) && 
    <Typography variant="body2" color="textSecondary">
      share to <Link>{inputValue}</Link>
    </Typography>
  }

  return (
    <CreatableSelect
      isMulti
      isClearable
      options={options}
      theme={selectTheme}
      className={css.select}
      classNamePrefix="select"
      placeholder="Search user to share with..."
      onChange={handleChange}
      isValidNewOption={(v) => mailformat.test(v)}
      formatCreateLabel={validateEmail}
    />
  )
}

const useStyles = makeStyles({
  select: {
    margin: `${spacing.xl}px ${spacing.xl}px 0`,
    fontSize: fontSizes.md,
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
