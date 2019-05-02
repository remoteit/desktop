import React from 'react'
import { Link } from '@material-ui/core'

export function NoDevicesMessage() {
  return (
    <div className="center gray">
      It appears you have no devices, please go to{' '}
      <Link href="https://app.remote.it">app.remote.it</Link> to add devices.
    </div>
  )
}
