import * as sudo from 'sudo-prompt'

export const sudoPromise = async (command: string, options: any): Promise<{ stdout: string; stderr: string }> => {
  return new Promise(async (resolve, reject) => {
    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) reject(error)
      resolve({ stdout, stderr })
    })
  })
}
