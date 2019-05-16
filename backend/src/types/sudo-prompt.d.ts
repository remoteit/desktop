declare module 'sudo-prompt' {
  declare function exec(
    cmd: string,
    options: any,
    callback: (error: Error, stdout: any, stderr: any) => void
  ): void
}
