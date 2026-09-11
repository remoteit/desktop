#!/usr/bin/env node

// Print the GitHub repository (owner/repo) a build publishes to. Branding rewrites
// electron/package.json's repository from brands/<brand>/config.ts, so every `gh`
// call in CI has to target that repository rather than the one the workflow runs in.
// Reads the brand config directly: the prepare job needs this before npm install.

const fs = require('fs')
const path = require('path')

const brand = process.env.BRAND || 'remoteit'
const configPath = path.join(__dirname, '..', '..', 'brands', brand, 'config.ts')
const match = fs.readFileSync(configPath, 'utf8').match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?['"]/)
if (!match) {
  console.error(`[release-repo] no GitHub repository url in ${configPath}`)
  process.exit(1)
}
console.log(`${match[1]}/${match[2]}`)
