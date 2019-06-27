import https from 'https'
import { createWriteStream } from 'fs'

export function download(
  tag: string,
  binaryName: string,
  path: string,
  progress = (percent: number) => {}
) {
  return new Promise((resolve, reject) => {
    const url = `https://github.com/remoteit/connectd/releases/download/${tag}/${binaryName}`

    progress(0)

    https
      .get(url, res1 => {
        if (!res1 || !res1.headers || !res1.headers.location)
          return reject(new Error('No response from download URL!'))
        https
          .get(res1.headers.location, res2 => {
            if (!res2 || !res2.headers || !res2.headers['content-length'])
              return reject(new Error('No response from location URL!'))
            const total = parseInt(res2.headers['content-length'], 10)
            let completed = 0
            const w = createWriteStream(path)
            res2.pipe(w)
            res2.on('data', data => {
              completed += data.length
              progress(completed / total)
            })
            res2.on('progress', progress)
            res2.on('error', reject)
            res2.on('end', resolve)
          })
          .on('error', reject)
      })
      .on('error', reject)
  })
}
