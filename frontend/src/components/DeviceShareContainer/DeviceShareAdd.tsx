import React from 'react'
import Select, { Theme } from 'react-select'
import { makeStyles } from '@material-ui/core'
import { generateContactOptions } from '../../models/contacts'
import { ApplicationState } from '../../store'
import { useSelector } from '../../hooks/reactReduxHooks'
import { IContact } from 'remote.it'
import { colors, spacing, fontSizes } from '../../styling'

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

  function handleChange(opts: any, actionMeta: any): void {
    opts = opts && opts.length ? opts : []
    onChange(opts.map((o: any) => o.value))
  }

  return (
    <Select
      isMulti
      isClearable
      options={options}
      theme={selectTheme}
      className={css.select}
      classNamePrefix="select"
      value={options.filter(o => selectedContacts.includes(o.value))}
      placeholder="Search user to share with..."
      onChange={handleChange}
      noOptionsMessage={e =>
        e.inputValue
          ? `${e.inputValue} does not currently have a remote.it account. Please have them sign up first so that you can share to them.`
          : 'You do not have contacts'
      }
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
  console.log('THEME', theme)
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
