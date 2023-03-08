import headless from 'remoteit-headless'
import ElectronApp from './ElectronApp'

process.title = 'remoteit-desktop'
headless.recapitate(new ElectronApp())
