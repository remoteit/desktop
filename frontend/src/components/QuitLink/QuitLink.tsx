import React from 'react'
import { QuitLinkControllerProps } from '../../controllers/QuitLinkController/QuitLinkController'
import { Link } from '@material-ui/core'
import { Icon } from '../Icon'

export function QuitLink({ quit }: QuitLinkControllerProps) {
  function warning() {
    if (confirm('Are you sure? Quitting will close all active connections.')) {
      quit()
    }
  }

  return (
    <Link onClick={warning} type="button" className="c-pointer">
      <Icon name="skull-crossbones" className="mr-sm" />
      Quit
    </Link>
  )
}
