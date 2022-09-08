import React, { useState, useRef } from 'react'
import { MAX_NAME_LENGTH } from '../shared/constants'
import { useHistory } from 'react-router-dom'
import { TextField, Button } from '@mui/material'
import { selectNetwork } from '../models/networks'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { GuideStep } from './GuideStep'
import { Gutters } from './Gutters'
import sleep from '../services/sleep'

export const NetworkAdd: React.FC = () => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
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
    <form
      onSubmit={async event => {
        event.preventDefault()
        setAdding(true)
        await dispatch.networks.addNetwork({ ...network, name })
        dispatch.ui.guide({ guide: 'network', step: 3 })
        reset()
      }}
    >
      <Gutters>
        <TextField
          required
          fullWidth
          autoFocus
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
      </Gutters>
      <Gutters>
        <GuideStep
          step={2}
          guide="network"
          instructions="Click here after entering your network name."
          placement="top-end"
          highlight
        >
          <Button color="primary" disabled={name.length < 2 || adding} variant="contained" type="submit">
            {adding ? 'Adding...' : 'Add'}
          </Button>
        </GuideStep>
        <Button
          onClick={() => {
            history.goBack()
            reset()
          }}
        >
          Cancel
        </Button>
      </Gutters>
    </form>
  )
}
