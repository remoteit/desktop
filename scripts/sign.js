require('dotenv').config()

exports.default = async function(conf) {
  // do not include passwords or other sensitive data in the file
  // rather create environment variables with sensitive data
  const tokenPassword = process.env.CSC_KEY_PASSWORD

  if (conf.hash === 'sha1') return
  if (require('os').platform() !== 'win32') {
    console.log(`SKIPPING WINDOWS SIGNING ${conf.path}`)
    return
  }

  console.log(`Signing Windows Binary ${conf.path}`)

  require('child_process').execSync(
    `signtool sign /d ${conf.name} /du ${conf.site} /p ${tokenPassword} /a ${conf.path}`,
    {
      stdio: 'inherit',
    }
  )
}

// Example configurations:
// const e1 = {
//   path: 'C:\\Users\\jamie\\Code\\desktop\\dist\\remoteit-installer.exe',
//   name: 'remoteit',
//   site: 'https://remote.it',
//   options: { target: 'nsis', sign: './sign.js' },
//   hash: 'sha1',
//   isNest: false,
// }
// const e2 = {
//   path: 'C:\\Users\\jamie\\Code\\desktop\\dist\\remoteit-installer.exe',
//   name: 'remoteit',
//   site: 'https://remote.it',
//   options: { target: 'nsis', sign: './sign.js' },
//   hash: 'sha256',
//   isNest: true,
// }
