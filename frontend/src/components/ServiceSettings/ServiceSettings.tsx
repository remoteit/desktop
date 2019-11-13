import React, { useState, useEffect } from 'react'
import { IService } from 'remote.it'
import BackendAdaptor from '../../services/BackendAdapter'
import { REGEX_PORT_SAFE } from '../../constants'
import { useHistory, useLocation } from 'react-router-dom'
import { newConnection } from '../../helpers/connectionHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../../components/Icon'
import { List, TextField, Tooltip, IconButton } from '@material-ui/core'
import { LanShareSelect } from '../../components/LanShareSelect'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const ServiceSettings: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const [port, setPort] = useState((connection && connection.port) || freePort)
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  useEffect(() => {
    if (port === undefined) setPort(freePort)
  }, [port, freePort])

  if (!service || (connection && connection.active)) return null
  if (!connection) connection = newConnection(service, { port })
  connection.port = port

  const disabled = connection.active

  return (
    <>
      <List>
        <LanShareSelect
          disabled={disabled}
          onClick={() => history.push(location.pathname + '/lan')}
          serviceID={service.id}
        />
      </List>
      <div className={css.indent}>
        <TextField
          label="Port"
          value={port}
          variant="filled"
          disabled={disabled}
          onChange={event => setPort(+event.target.value.replace(REGEX_PORT_SAFE, ''))}
          helperText="Must be a unique number"
        />
        {!disabled && (
          <Tooltip title="Auto assign">
            <span>
              <IconButton
                onClick={() => {
                  setPort(undefined)
                  BackendAdaptor.emit('freePort', connection)
                }}
              >
                <Icon name="redo" color="gray-darker" size="md" weight="regular" fixedWidth />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </div>
    </>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
  indent: {
    margin: `${spacing.md}px 65px`,
    '& .MuiIconButton-root': {
      margin: spacing.sm,
    },
  },
})
