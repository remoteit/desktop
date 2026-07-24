import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_NAME_LENGTH } from '@common/constants'
import { useHistory } from 'react-router-dom'
import { TextField, Button } from '@mui/material'
import { selectNetwork } from '../models/networks'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { GuideStep } from './GuideStep'
import { Gutters } from './Gutters'
import sleep from '../helpers/sleep'

export const NetworkAdd: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [name, setName] = useState<string>('')
  const [adding, setAdding] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const network = useSelector((state: State) => selectNetwork(state))

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
          label={t('networkAdd.name', 'Name')}
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
          instructions={t('networkAdd.guideInstructions', 'Click here after entering your network name.')}
          placement="top-end"
          highlight
        >
          <Button color="primary" disabled={name.length < 2 || adding} variant="contained" type="submit">
            {adding ? t('networkAdd.adding', 'Adding...') : t('networkAdd.add', 'Add')}
          </Button>
        </GuideStep>
        <Button
          onClick={() => {
            history.goBack()
            reset()
          }}
        >
          {t('networkAdd.cancel', 'Cancel')}
        </Button>
      </Gutters>
    </form>
  )
}
