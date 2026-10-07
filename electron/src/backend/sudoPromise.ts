import { exec } from '@vscode/sudo-prompt'

export const sudoPromise = (command: string): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) =>
    exec(command, { name: 'remoteit' }, (error, stdout, stderr) =>
      error ? reject(error) : resolve({ stdout, stderr })
    )
  )
