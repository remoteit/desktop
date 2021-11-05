import environment from './environment'

export function getEnvironment() {
  return environment
}

export function isWindows() {
  return environment.isWindows
}
