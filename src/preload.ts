import { webFrame } from 'electron'

function log() {
  const usage = webFrame?.getResourceUsage()
  console.table(usage)
}

// setInterval(log, 5000) - disabled since we seem to have found the memory leak
