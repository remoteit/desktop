#!/usr/bin/env node

const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'src', 'backend')
const buildBackendDir = path.join(rootDir, 'build', 'backend')
const frontendBuildDir = path.resolve(rootDir, '..', 'frontend', 'build')
const commonBuildDir = path.resolve(rootDir, '..', 'common', 'build')
const sslDir = path.join(backendDir, 'ssl')

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

async function copyDir(src, dest) {
  await fsp.rm(dest, { recursive: true, force: true })
  await ensureDir(path.dirname(dest))
  await fsp.cp(src, dest, { recursive: true })
}

async function copyDirContents(src, dest) {
  const entries = await fsp.readdir(src, { withFileTypes: true })
  await ensureDir(dest)

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    await fsp.rm(destPath, { recursive: true, force: true })
    if (entry.isDirectory()) {
      await fsp.cp(srcPath, destPath, { recursive: true })
    } else {
      await ensureDir(path.dirname(destPath))
      await fsp.copyFile(srcPath, destPath)
    }
  }
}

async function main() {
  await ensureDir(buildBackendDir)

  if (fs.existsSync(commonBuildDir)) {
    await copyDir(commonBuildDir, path.join(buildBackendDir, 'common'))
  }

  if (fs.existsSync(frontendBuildDir)) {
    await copyDirContents(frontendBuildDir, buildBackendDir)
  }

  if (fs.existsSync(sslDir)) {
    await copyDir(sslDir, path.join(buildBackendDir, 'ssl'))
  }
}

main().catch(error => {
  console.error('[backend:sync] Failed to copy backend assets:', error)
  process.exit(1)
})
