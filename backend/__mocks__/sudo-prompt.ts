export function exec(command: string, options: {}, callback: (error: string, stdout: string, stderr: string) => void) {
  callback('', `sudo ${command} executed`, '')
}

export default {
  exec,
}
