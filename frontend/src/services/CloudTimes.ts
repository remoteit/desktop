class CloudTimes {
  private times: Map<string, number>
  private cleanupInterval?: NodeJS.Timeout
  private threshold: number

  constructor(cleanupMinutes: number = 5) {
    this.times = new Map<string, number>()
    this.threshold = cleanupMinutes * 60 * 1000
    this.cleanupInterval = setInterval(() => this.cleanup(), this.threshold)
  }

  outdated(timestamp: number, id?: string): boolean {
    if (!id) return false
    const last = this.times.get(id)
    this.times.set(id, timestamp)
    if (!last || last < timestamp) return false
    console.log('%cOUTDATED EVENT DETECTED', 'color:red;font-weight:bold', id, last, ' < ', timestamp)
    return true
  }

  private cleanup() {
    const now = Date.now()
    this.times.forEach((timestamp, id) => {
      if (now - timestamp > this.threshold) {
        this.times.delete(id)
      }
    })
  }
}

export default CloudTimes
