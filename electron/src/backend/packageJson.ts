import path from 'path'
import fs from 'fs'

// scripts/airbrake.js adds `airbrake` to the packaged package.json; source checkouts have none.
type IPackageJson = { version: string; airbrake?: { projectId?: number; projectKey?: string } }

function readPackageJson(): IPackageJson {
  const candidates = [
    path.resolve(__dirname, '../package.json'),
    path.resolve(__dirname, '..', '..', 'package.json'),
    path.resolve(__dirname, '..', '..', '..', 'package.json'),
  ]

  const pkgPath = candidates.find(fs.existsSync)
  if (!pkgPath) return { version: '0.0.0' }

  const content = fs.readFileSync(pkgPath)
  return JSON.parse(content.toString())
}

export default readPackageJson()
