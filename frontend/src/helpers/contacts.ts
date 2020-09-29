export function contactOptions(all: IUser[], selected: IUser[]): IReactSelectOption[] {
  if (!all.length) return []

  const selectedEmails = selected.map(c => c.email)
  return all.map(c => ({
    value: c.email,
    label: c.email,
    isDisabled: selectedEmails.includes(c.email),
  }))
}
