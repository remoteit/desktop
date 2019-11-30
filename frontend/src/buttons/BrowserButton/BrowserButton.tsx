import React from 'react'
import { hostName } from '../../helpers/nameHelper'
import { IService } from 'remote.it'
import { IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  service?: IService
}

export const BrowserButton: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()

  if (!connection || !connection.active) return null

  return (
    <Tooltip title="Launch Browser">
      <IconButton onClick={() => window.open(`http://${hostName(connection)}`)}>
        <Icon className={css.rotate} name="arrow-right" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)' },
})
