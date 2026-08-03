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

// Devices are selected in click order, so re-order on each change to follow the list the user
// is looking at — which respects whatever sort they've chosen. Ids no longer in the list (a
// selection outliving a filter change) keep their relative order at the end.
export function sortSelectedIds(selected: string[], devices: IDevice[]) {
  const order = new Map(devices.map((device, index) => [device.id, index]))
  return [...selected].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity))
}

export function removeSelectedIds(selected: string[], idsToRemove: string[]) {
  const remove = new Set(idsToRemove)
  return selected.filter(id => !remove.has(id))
}
