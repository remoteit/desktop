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

// Keeps the selection in name order from the first click, so it never reorders downstream.
export function sortSelectedIds(selected: string[], devices: IDevice[]) {
  const names = new Map(devices.map(device => [device.id, device.name]))
  return [...selected].sort((a, b) =>
    (names.get(a) || a).localeCompare(names.get(b) || b, undefined, { numeric: true, sensitivity: 'base' })
  )
}

export function removeSelectedIds(selected: string[], idsToRemove: string[]) {
  const remove = new Set(idsToRemove)
  return selected.filter(id => !remove.has(id))
}
