import fs from 'fs'
import path from 'path'

export const PORT = 443

export const KEY_PATH = path.join(__dirname, 'cert', 'desktop.rt3.io.key')
export const KEY_FILE = fs.readFileSync(KEY_PATH)
export const CERT_PATH = path.join(__dirname, 'cert', 'fullchain.cer')
export const CERT_FILE = fs.readFileSync(CERT_PATH)

export const GA_CODE = 'UA-76016818-10'

export const PEER_PORT_RANGE = [33000, 42999]
export const PROXY_PORT_RANGE = [43000, 52999]
