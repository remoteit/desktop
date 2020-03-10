export function exec(command: string, options: {}, callback: (error: string, stdout: string, stderr: string) => void) {
  callback('', `sudo ${command} executed`, '')
}

export default {
  exec,
}

/* 
const help = jest.fn(
  (command: string, options: any, callback: (error: Error, stdout: any, stderr: any) => void) => {
    console.log('HELP CALLED')
    callback(new Error(), `sudo ${command} executed`, '')
  }
)
const execSpy = jest.spyOn(sudoPrompt, 'exec').mockImplementation(help)
console.log(help.mock.calls)
*/
