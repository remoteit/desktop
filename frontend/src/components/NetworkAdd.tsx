import React, { useState, useRef } from 'react'
import { MAX_NAME_LENGTH } from '../shared/constants'
import { matchPath, useLocation, useHistory } from 'react-router-dom'
import { Collapse, Typography, TextField, Box } from '@mui/material'
import { selectNetwork } from '../models/networks'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { GuideStep } from './GuideStep'
import { Gutters } from './Gutters'
import sleep from '../services/sleep'

export const NetworkAdd: React.FC<{ networks: INetwork[] }> = ({ networks }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const show = !!matchPath(location.pathname, { path: '/networks/new' })
  const [name, setName] = useState<string>('')
  const [adding, setAdding] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const network = useSelector((state: ApplicationState) => selectNetwork(state))

  const reset = async () => {
    await sleep(1000)
    setAdding(false)
    setName('')
  }

  return (
    <Collapse in={show} onEntered={() => inputRef.current?.focus()}>
      <Typography variant="subtitle1" color="primary">
        New Network
      </Typography>
      <Gutters bottom={null}>
        <form
          onSubmit={async event => {
            event.preventDefault()
            setAdding(true)
            await dispatch.networks.addNetwork({ ...network, name })
            dispatch.ui.guide({ guide: 'guideNetwork', step: 3 })
            reset()
          }}
        >
          <Box display="flex" alignItems="center" marginRight={-1}>
            <TextField
              required
              fullWidth
              label="Name"
              value={name}
              disabled={adding}
              variant="filled"
              inputRef={inputRef}
              onChange={event => {
                let name = event.target.value.toString()
                if (name.length > MAX_NAME_LENGTH) name.substring(0, MAX_NAME_LENGTH)
                setName(name)
              }}
            />
            <IconButton
              icon="times"
              color="grayDark"
              onClick={() => {
                history.goBack()
                reset()
              }}
              inline
              fixedWidth
            />
            <GuideStep
              step={2}
              guide="guideNetwork"
              instructions="Click here after entering your network name."
              placement="top-end"
              highlight
            >
              <IconButton icon="check" color="primary" disabled={name.length < 2} submit fixedWidth loading={adding} />
            </GuideStep>
          </Box>
        </form>
      </Gutters>
    </Collapse>
  )
}
