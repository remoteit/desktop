import preferences from './preferences'
import environment from './environment'
import Logger from './Logger'
import path from 'path'
import fs from 'fs/promises'

const CONFIG_HEADER = `HostKeyAlgorithms +ssh-rsa
  NoHostAuthenticationForLocalhost yes
  IdentitiesOnly yes
  UseKeychain yes
  AddKeysToAgent yes
  ForwardAgent yes\n`

type IConfig = Pick<IConnection, 'host' | 'port' | 'identityUsername' | 'identityFilePath'>

class SSHConfig {
  ready: boolean = false
  configPath: string = ''
  lastData: IConfig[] = []

  init() {
    this.setup()
  }

  async setup() {
    const userConfig = environment.sshConfigPath
    this.configPath = path.join(environment.userPath, 'ssh')
    this.ready = true

    let data: string = ''

    try {
      data = await fs.readFile(userConfig, 'utf8')
    } catch (error) {
      if (error instanceof Error) {
        // File doesn't exist
        if ('code' in error && error.code === 'ENOENT') {
          const include = `Include ${this.configPath}\n`

          try {
            await fs.writeFile(userConfig, include, 'utf8')
            Logger.info('SSH CONFIG', { message: 'SSH config created successfully' })
          } catch (writeErr) {
            if (!(writeErr instanceof Error)) return
            Logger.error('SSH CONFIG ERROR', { message: `Failed to write SSH config: ${writeErr.message}` })
          }

          return
        } else {
          Logger.error('SSH CONFIG ERROR', { message: `Failed to read SSH config: ${error.message}` })
          return
        }
      }
    }

    // file exists
    if (data.includes(this.configPath)) {
      Logger.info('SSH CONFIG', { message: 'SSH config already includes app SSH config path' })
      return
    }

    const updatedConfig = `${data.trim()}\n\nInclude ${this.configPath}\n`

    try {
      await fs.writeFile(userConfig, updatedConfig, 'utf8')
      Logger.info('SSH CONFIG', { message: 'SSH config updated successfully' })
    } catch (writeErr) {
      if (writeErr instanceof Error) {
        Logger.error('SSH CONFIG ERROR', { message: `Failed to write SSH config: ${writeErr.message}` })
      }
    }
  }

  async toggle(use: boolean) {
    if (use) {
      await this.init()
    } else {
      await this.cleanup()
    }
  }

  async cleanup() {
    if (!this.ready) return
    const userConfig = environment.sshConfigPath

    try {
      let data = await fs.readFile(userConfig, 'utf8')

      // Remove the include line
      const includeLine = `Include ${this.configPath}\n`
      data = data.replace(includeLine, '')

      // Write the cleaned data back to the user's config file
      await fs.writeFile(userConfig, data, 'utf8')
      Logger.info('SSH CONFIG', { message: 'SSH config cleaned successfully' })

      // Remove the application's own config file
      await fs.unlink(this.configPath)
      Logger.info('SSH CONFIG', { message: 'App SSH config file removed successfully' })
    } catch (error) {
      if (error instanceof Error) {
        Logger.error('SSH CONFIG ERROR', { message: `Failed to clean SSH config: ${error.message}` })
      }
    }
  }

  async update(connections: IConnection[]): Promise<void> {
    if (!preferences.get().sshConfig || !this.ready) return

    const qualified: IConfig[] = connections
      .filter(c => c.typeID === 28 && c.enabled && c.host && c.port && c.identityUsername)
      .map(c => ({
        host: c.host,
        port: c.port,
        identityUsername: c.identityUsername,
        identityFilePath: c.identityFilePath,
      }))

    if (!this.changed(qualified)) return

    const config = await this.generateConfig(qualified)

    try {
      await fs.writeFile(this.configPath, config, 'utf8')
      Logger.info('SSH CONFIG UPDATE', { path: this.configPath, data: config })
    } catch (error) {
      if (error instanceof Error) {
        Logger.error('SSH CONFIG UPDATE ERROR', { message: `Failed to write app SSH config: ${error.message}` })
      }
    }
  }

  async generateConfig(connections: IConfig[]): Promise<string> {
    let config = CONFIG_HEADER

    connections.forEach(connection => {
      config += `\nHost ${connection.host}\n  Port ${connection.port}\n  User ${connection.identityUsername}\n`
      if (connection.identityFilePath) {
        config += `  IdentityFile ${connection.identityFilePath}\n`
      }
    })

    return config
  }

  changed(data: IConfig[]): boolean {
    // If the lengths are different, the data has changed
    if (this.lastData.length !== data.length) {
      this.lastData = data
      Logger.info('SSH CONFIG UPDATE', { message: 'SSH config length changed' })
      return true
    }

    // If any item is different, the data has changed
    for (let i = 0; i < this.lastData.length; i++) {
      const last = this.lastData[i]
      const next = data[i]
      if (
        last.host !== next.host ||
        last.port !== next.port ||
        last.identityUsername !== next.identityUsername ||
        last.identityFilePath !== next.identityFilePath
      ) {
        this.lastData = data
        Logger.info('SSH CONFIG UPDATE', {
          message: 'SSH config item changed',
          item: data[i],
          lastItem: this.lastData[i],
        })
        return true
      }
    }

    return false
  }
}

export default new SSHConfig()
