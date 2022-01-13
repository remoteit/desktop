import { webFrame } from 'electron'

function log() {
  // `format` omitted  (pads + limits to 15 characters for the output)
  // function logMemDetails(x) {
  //   function toMb(bytes) {
  //     return (bytes / (1000.0 * 1000)).toFixed(2)
  //   }

  //   console.log(
  //     format(x[0]),
  //     format(x[1].count),
  //     format(toMb(x[1].size) + "MB"),
  //     format(toMb(x[1].liveSize) +"MB")
  //   )
  // }
  const usage = webFrame?.getResourceUsage()
  console.table(usage)
}

setInterval(log, 5000)
