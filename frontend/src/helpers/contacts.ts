export function contactOptions(all: IUser[], selected: IUser[]): IReactSelectOption[] {
  if (!all.length) return []

  const selectedEmails = selected.map(c => c.email)
  const options = all.map(c => ({
    value: c.email,
    label: c.email,
    isDisabled: selectedEmails.includes(c.email),
  }))

  return options.sort((a: any, b: any) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0))
}
