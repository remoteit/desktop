import React from 'react'
import { IContact } from 'remote.it'
import { generateContactOptions } from '../../models/contacts'
import Select from 'react-select'
import { useSelector } from '../../hooks/reactReduxHooks'
import { ApplicationState } from '../../store'

export function DeviceShareAdd({
  contacts,
  onChangeContacts,
  selectedContacts
}: {
  contacts: IContact[]
  onChangeContacts: (contacts: string[]) => void
  selectedContacts: string[]
}): JSX.Element {

  function handleContactChange(contacts: string[]): void {
    onChangeContacts(contacts)
  }
  return (
    <>
      <ContactSelector 
        contacts={contacts} 
        onChange={handleContactChange} 
        selectedContacts={selectedContacts} 
      />
    </>
  )
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

  function handleChange(opts: any, actionMeta: any): void {
    opts = opts && opts.length ? opts : []
    onChange(opts.map((o: any) => o.value))
  }

  return (
    <Select
      options={options}
      value={options.filter(o => selectedContacts.includes(o.value))}
      placeholder="Search user to share with..."
      isMulti
      isClearable
      maxMenuHeight={200}
      noOptionsMessage={e => e.inputValue ? `${e.inputValue} does not currently have a remote.it account. Please have them sign up first so that you can share to them.` : 'You do not have contacts'}
      onChange={handleChange}
      styles={{
        control: (styles: any) => ({
          ...styles,
          margin: '20px 0 0 0',
          padding: '0 10px 0 0px',
          ':hover': {
            borderColor: '#0096e7',
          },
        }),
        option: (styles: any, { isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) => ({
          ...styles,
          backgroundColor: isFocused || isSelected ? '#ccedff' : 'white',
          ':hover': {
            backgroundColor: '#ccedff',
          },
        }),
        multiValue: (styles: any) => ({
          ...styles,
          backgroundColor: '#ccedff',
          borderRadius: '0.3em',
        }),
        multiValueLabel: (styles: any) => ({
          ...styles,
          paddingTop: '6px',
          paddingBottom: '6px',
        }),
        multiValueRemove: (styles: any) => ({
          ...styles,
          paddingTop: '6px',
          paddingBottom: '6px',
        }),
        placeholder: (styles: any) => ({
          ...styles,
          color: '#777',
        }),
      }}
    />
  )
}
