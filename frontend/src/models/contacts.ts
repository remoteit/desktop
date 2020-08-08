export function generateContactOptions(
  allContacts: ContactFields[]
): IReactSelectOption[] {
  if (!allContacts.length) return []

  return allContacts
    .map(c => {
      return createOption(c)
    })
}

function createOption(contact: ContactFields): IReactSelectOption {
  const label =
    (contact.firstName === '-' && contact.lastName === '-') ||
    (!contact.firstName && !contact.lastName)
      ? contact.email
      : `${contact.firstName} ${contact.lastName} <${contact.email}> `
  const opt: IReactSelectOption = { value: contact.email, label }
  return opt
}
