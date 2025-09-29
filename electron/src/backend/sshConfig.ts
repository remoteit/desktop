import preferences from './preferences'
import environment from './environment'
import isEqual from 'lodash.isequal'
import Logger from './Logger'
import path from 'path'
import fs from 'fs/promises'

const CONFIG_HEADER = `Host *
  HostKeyAlgorithms +ssh-rsa
  AddKeysToAgent yes
  ForwardAgent yes
  IdentitiesOnly yes
  NoHostAuthenticationForLocalhost yes\n`

type ConfigType = ILookup<string | number | undefined>

class SSHConfig {
  filename: string = 'ssh_config'
  ready: boolean = false
  configPath: string = ''
  lastData: ConfigType[] = []

  init() {
    this.setup()
  }

  async setup() {
    const userConfigPath = path.resolve(environment.sshConfigPath, '..')
    const userConfig = environment.sshConfigPath
    this.configPath = path.join(environment.userPath, this.filename)
    this.ready = true

    let data: string = ''

    try {
      // Create the config directory if needed
      await fs.access(userConfigPath)
    } catch (error) {
      await fs.mkdir(userConfigPath, { recursive: true })
      await fs.chmod(userConfigPath, 0o700)
    }

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

    const qualified: ConfigType[] = connections
      .filter(c => c.typeID === 28 && c.enabled && c.host && c.port)
      .map(c => ({
        ...c.identity,
        host: c.host,
        port: c.port,
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

  async generateConfig(configs: ConfigType[]): Promise<string> {
    let result = CONFIG_HEADER
    if (environment.isMac) result += `  UseKeychain yes\n`

    for (const config of configs) {
      result += `\nHost ${config.host}\n`
      for (const param in config) {
        if (param === 'host') continue
        result += `  ${capitalize(param)} ${config[param]}\n`
      }
    }

    return result
  }

  changed(data: ConfigType[]): boolean {
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

      if (isEqual(last, next)) continue

      this.lastData = data
      Logger.info('SSH CONFIG UPDATE', {
        message: 'SSH config item changed',
        item: data[i],
        lastItem: this.lastData[i],
      })
      return true
    }

    return false
  }
}

export default new SSHConfig()

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
