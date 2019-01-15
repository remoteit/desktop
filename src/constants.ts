import fs from 'fs'
import path from 'path'

export const PORT = 443
export const KEY_PATH = path.join(__dirname, 'cert', 'desktop.rt3.io.key')
export const KEY_FILE = fs.readFileSync(KEY_PATH)
export const CERT_PATH = path.join(__dirname, 'cert', 'fullchain.cer')
export const CERT_FILE = fs.readFileSync(CERT_PATH)
