require('dotenv').config()

const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')
const { config } = require('dotenv')

const TEMP_DIR = path.resolve(__dirname, '../temp')
const TOOL_DIR = path.resolve(os.homedir(), 'CodeSignTool/')
const TOOL_PATH = path.resolve(TOOL_DIR, 'CodeSignTool.bat')
const CMD_PATH = path.resolve('C:/Windows/System32/cmd.exe')

const RED = '\x1b[31m'
const BLUE = '\x1b[34m'
const END = '\x1b[0m'

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

exports.default = async function sign(configuration) {
  if (process.env.SKIP_SIGNING === 'true') {
    console.log(`  ${RED}!${END} SKIP signing  ${BLUE}path${END}=${configuration.path}`)
    return
  }

  const username = process.env.WINDOWS_SIGN_USER_NAME
  const userPassword = process.env.WINDOWS_SIGN_USER_PASSWORD
  const credentialId = process.env.WINDOWS_SIGN_CREDENTIAL_ID
  const userTOTP = process.env.WINDOWS_SIGN_USER_TOTP

  if (username && userPassword && userTOTP && credentialId) {
    const { name, dir } = path.parse(configuration.path)

    // Sign and replace file
    const tempFile = path.join(TEMP_DIR, name)
    const signFile = `${CMD_PATH} /C ${TOOL_PATH} sign -input_file_path="${configuration.path}" -output_dir_path="${TEMP_DIR}" -credential_id="${credentialId}" -username="${username}" -password="${userPassword}" -totp_secret="${userTOTP}"`
    const moveFile = `mv "${tempFile}" "${dir}"`

    console.log(`  ${BLUE}•${END} signing      ${BLUE}name${END}=${name}`)

    execSync(signFile, { env: { CODE_SIGN_TOOL_PATH: TOOL_DIR } })
    execSync(moveFile)
  } else {
    // Missing data
    console.warn(`Can't sign file ${configuration.path}, missing .env data:
      WINDOWS_SIGN_USER_NAME="${username}"
      WINDOWS_SIGN_USER_PASSWORD="${userPassword}"
      WINDOWS_SIGN_CREDENTIAL_ID="${credentialId}"
      WINDOWS_SIGN_USER_TOTP="${userTOTP}"
    `)
    process.exit(1)
  }
}
