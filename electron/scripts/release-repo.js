#!/usr/bin/env node

// Prints the owner/repo a brand publishes to, read straight from brands/<brand>/config.ts
// because the prepare job runs before npm install.

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
