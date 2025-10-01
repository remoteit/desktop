export function exec(command: string, options: {}, callback: (error: string, stdout: string, stderr: string) => void) {
  callback('', `${command} executed`, '')
}
