class CloudTimes {
  private times: Map<string, number>

  constructor(_cleanupMinutes: number = 5) {
    this.times = new Map<string, number>()
  }

  outdated(timestamp: number, id?: string): boolean {
    if (!id) return false
    const last = this.times.get(id)
    this.times.set(id, timestamp)
    if (!last || last < timestamp) return false
    console.log('%cOUTDATED EVENT DETECTED', 'color:red;font-weight:bold', id, last, ' < ', timestamp)
    return true
  }

}

export default CloudTimes
