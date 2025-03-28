/// <reference path="../types.d.ts" />

import { join } from 'path'
import config from '../common/src/brand/config'
import fs from 'fs'

async function update(): Promise<void> {
  const projectRoot = join(__dirname, '..')

  const electronPackagePath = join(projectRoot, 'electron', 'package.json')
  let pkg = JSON.parse(fs.readFileSync(electronPackagePath, 'utf8'))

  pkg = {
    ...pkg,
    ...config.package,
    name: config.name,
    build: {
      ...pkg.build,
      ...config.package?.build,
    },
  }

  console.log('Updating electron package.json')
  fs.writeFileSync(electronPackagePath, JSON.stringify(pkg, null, 2))
}

update().catch(error => {
  console.error('Error loading brand config:', error)
  process.exit(1)
})
