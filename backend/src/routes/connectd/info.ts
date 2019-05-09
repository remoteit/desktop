import { exists, version } from '../../connectd/binary'
import { targetPath } from '../../connectd/host'

export function info() {
  return async (callback: (data: any) => void) => {
    const params = {
      exists: exists(),
      path: targetPath(),
      version: version(),
    }
    // track.event(
    //   'connectd',
    //   'info',
    //   'Retrieved connectd info',
    //   `exists: ${params.exists}, path: ${params.path}, version: ${
    //     params.version
    //   }`
    // )
    callback(params)
  }
}
