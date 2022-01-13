import { webFrame } from 'electron'

function log() {
  const usage = webFrame?.getResourceUsage()
  console.table(usage)
}

setInterval(log, 5000)
