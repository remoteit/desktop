import environment from './environment'

export function getEnvironment() {
  return environment.frontend
}

export const isPortal = () => false
