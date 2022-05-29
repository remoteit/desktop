import React, { useState } from 'react'
import { MAX_NAME_LENGTH } from '../shared/constants'
import { matchPath, useLocation, useHistory, Link } from 'react-router-dom'
import { Collapse, Typography, TextField, Box } from '@material-ui/core'
import { selectNetwork } from '../models/networks'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from './Gutters'

export const NetworkAdd: React.FC<{ networks: INetwork[] }> = ({ networks }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const show = !!matchPath(location.pathname, { path: '/networks/new' })
  const [name, setName] = useState<string>('')
  const network = useSelector((state: ApplicationState) => selectNetwork(state))

  return (
    <>
      <Collapse in={show} timeout={400}>
        <Typography variant="subtitle1" color="primary">
          New Network
        </Typography>
        <Gutters>
          <form
            onSubmit={event => {
              event.preventDefault()
              dispatch.networks.setNetwork({ ...network, name })
              setName('')
            }}
          >
            <Box display="flex" alignItems="center">
              <TextField
                required
                autoFocus
                fullWidth
                label="Name"
                value={name}
                variant="filled"
                onChange={event => {
                  let name = event.target.value.toString()
                  if (name.length > MAX_NAME_LENGTH) name.substring(0, MAX_NAME_LENGTH)
                  setName(name)
                }}
              />
              <IconButton icon="times" color="grayDark" onClick={() => history.goBack()} inline fixedWidth />
              <IconButton icon="check" color="success" submit fixedWidth />
            </Box>
          </form>
        </Gutters>
      </Collapse>
      <Collapse in={!show && !networks?.length} timeout={400}>
        <Gutters top="xxl">
          <Typography variant="h3" align="center" gutterBottom>
            Networks will appear here
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Add services to your networks from the <Link to="/devices">Devices</Link> tab.
            <br />
            Once added, they will connect automatically.
          </Typography>
        </Gutters>
      </Collapse>
    </>
  )
}
