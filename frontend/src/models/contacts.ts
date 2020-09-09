export function generateContactOptions(
  allContacts: ContactFields[],
  contactSelected: ContactFields[]
): IReactSelectOption[] {
  if (!allContacts.length) return []

  const listSelected = contactSelected.map( c => c.email)

  return allContacts
    .map(c => createOption(c, !listSelected.includes(c.email)))
}

function createOption(contact: ContactFields, isDisabled: boolean): IReactSelectOption {
  const label =
    (contact.firstName === '-' && contact.lastName === '-') ||
    (!contact.firstName && !contact.lastName)
      ? contact.email
      : `${contact.firstName} ${contact.lastName} <${contact.email}> `
  const opt: IReactSelectOption = { value: contact.email, label, isDisabled }
  return opt
}
