declare module 'electron-sudo' {
  declare class Sudoer {
    constructor(options: any)
    spawn(cmd: string, args: string[], options: any)
  }
  export = Sudoer
}
