type SelectableDeviceOptions = {
  isSelectable?: (device: IDevice) => boolean
}

export function getSelectableDeviceIds(devices: IDevice[], options: SelectableDeviceOptions = {}) {
  const { isSelectable } = options
  return devices.filter(device => (isSelectable ? isSelectable(device) : true)).map(device => device.id)
}

export function getInclusiveIdRange(orderedIds: string[], anchorId?: string, targetId?: string) {
  if (!anchorId || !targetId) return []
  const anchorIndex = orderedIds.indexOf(anchorId)
  const targetIndex = orderedIds.indexOf(targetId)

  if (anchorIndex < 0 || targetIndex < 0) return []

  const start = Math.min(anchorIndex, targetIndex)
  const end = Math.max(anchorIndex, targetIndex)

  return orderedIds.slice(start, end + 1)
}

export function mergeSelectedIds(selected: string[], idsToAdd: string[]) {
  return [...new Set([...selected, ...idsToAdd])]
}

// Reused across comparisons — localeCompare with options builds a new collator on every call.
const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

// Devices are selected in click order, so re-sort by name on each change to keep the
// selection ordered. Ids with no loaded device sort last rather than interleaving by raw id.
export function sortSelectedIds(selected: string[], devices: IDevice[]) {
  const names = new Map(devices.map(device => [device.id, device.name]))
  return [...selected].sort((a, b) => {
    const nameA = names.get(a)
    const nameB = names.get(b)
    if (!nameA || !nameB) return nameA ? -1 : nameB ? 1 : 0
    return nameCollator.compare(nameA, nameB)
  })
}

export function removeSelectedIds(selected: string[], idsToRemove: string[]) {
  const remove = new Set(idsToRemove)
  return selected.filter(id => !remove.has(id))
}
