import { exec } from 'sudo-prompt'

export const sudoPromise = async (command: string): Promise<{ stdout: string; stderr: string }> =>
  new Promise(async (resolve, reject) =>
    exec(command, { name: 'remoteit' }, (error, stdout, stderr) => {
      if (error) reject(error)
      resolve({ stdout, stderr })
    })
  )
