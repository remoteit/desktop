export function setGracefulCleanup() {}

export function dirSync() {
  return {
    name: 'test-name',
    removeCallback: () => {},
  }
}

export default {
  setGracefulCleanup,
  dirSync,
}
