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
  device,
  onChangeContacts,
  selectedContacts,
  setChanging,
}: {
  contacts: IContact[]
  device: IDevice
  onChangeContacts: (contacts: string[]) => void
  selectedContacts: string[]
  setChanging: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  function handleContactChange(contacts: string[]): void {
    onChangeContacts(contacts)
  }
  return (
    <ContactSelector
      device={device}
      contacts={contacts}
      onChange={handleContactChange}
      selectedContacts={selectedContacts}
      setChanging={setChanging}
    />
  )
}

function ContactSelector({
  device,
  contacts,
  onChange,
  selectedContacts = [],
  setChanging,
}: {
  device: IDevice
  contacts: IContact[]
  onChange: (latest: any) => void
  selectedContacts?: string[]
  setChanging: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const [devices] = useSelector((state: ApplicationState) => state.devices.all)
  const notShared = (c: { email: string }) => !device.access.find(s => s.email === c.email)
  const options = generateContactOptions(
    contacts.filter(o => o.email !== devices.owner),
    contacts.filter(notShared)
  )
  const css = useStyles()

  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

  const handleChange = (opts: any, actionMeta: any): void => {
    opts = opts && opts.length ? opts : []
    onChange(opts.map((o: any) => o.value))
    setChanging(true)
  }

  const validateEmail = (inputValue: any) => {
    return (
      mailformat.test(inputValue) && (
        <Typography variant="body2" color="textSecondary">
          share to <Link>{inputValue}</Link>
        </Typography>
      )
    )
  }

  return (
    <CreatableSelect
      isMulti
      isClearable
      options={options.sort((a: any, b: any) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0))}
      theme={selectTheme}
      className={css.select}
      classNamePrefix="select"
      placeholder="Enter an email..."
      onChange={handleChange}
      isValidNewOption={v => mailformat.test(v)}
      formatCreateLabel={validateEmail}
      styles={customStyles}
    />
  )
}

const useStyles = makeStyles({
  select: {
    margin: `${spacing.md}px ${spacing.xl}px 0`,
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

const customStyles = {
  option: (styles: any) => ({
    ...styles,
    cursor: 'pointer',
  }),
  control: (styles: any) => ({
    ...styles,
    cursor: 'pointer',
  }),
}
