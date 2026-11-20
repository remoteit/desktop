import { app } from 'electron'

// The backend starts when it is imported, so the lock comes before any other module: a second launch only
// hands its argv to the running instance (its second-instance event), instead of starting a backend, tray and window.
if (app.requestSingleInstanceLock()) require('./start')
else app.quit()
