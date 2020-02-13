import headless from 'remoteit-headless'
import ElectronApp from './ElectronApp'
;(function StartElectron() {
  setTimeout(() => (headless.electron = new ElectronApp()), 0)
})()
