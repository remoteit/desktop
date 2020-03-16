/* 
  THIS FILE IS NOT IN USE
 
  It was an attempt to get the builder to not ask for the password when building. 
  However, I couldn't get it to work, and upon further investigation found that you cannot get 
  an EV Signing Certificate to build without prompting. There was a workaround that 
  the cert software has a checkbox to only ask once per login for the password, 
  so I added that to the docs. I didn't want to throw away this signing script however, 
  so I left it, kinda incomplete.
  
  This script could be used if we ever move to a standard Signing Cert so 
  that we can build in an automated fashion.
*/

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
