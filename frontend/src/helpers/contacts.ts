export function contactOptions(all: IUser[], selected: IUser[]): IReactSelectOption[] {
  if (!all.length) return []

  const selectedEmails: any[] = []

  return all.map(c => ({
    value: c.email,
    label: c.email,
    isDisabled: selectedEmails.includes(c.email),
  }))
}
