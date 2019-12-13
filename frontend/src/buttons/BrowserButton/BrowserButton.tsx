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

const HTTP_TYPES = [1, 7, 8, 30, 33, 38]

export const BrowserButton: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()

  if (service && service.typeID && !HTTP_TYPES.includes(service.typeID)) return null
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
