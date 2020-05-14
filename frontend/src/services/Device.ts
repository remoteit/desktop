export default class Device {
  public static sort(devices: IDevice[], sort: SortType = 'alpha'): IDevice[] {
    const sorted = [...devices]
    // Always sort by alpha initially
    sorted.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      return 0
    })

    if (sort === 'state') {
      sorted.sort((a, b) => {
        if (a.state === b.state) return 0
        if (a.state === 'connected' && (b.state === 'active' || b.state === 'inactive')) return -1
        if (a.state === 'active' && b.state === 'inactive') return -1
        if (a.state === 'inactive' && (b.state === 'active' || b.state === 'connected')) return 1
        return 0
      })
    }

    return sorted
  }
}
