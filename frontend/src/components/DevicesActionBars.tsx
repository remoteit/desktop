import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { DevicesActionBar } from './DevicesActionBar'
import { DevicesSelectBar } from './DevicesSelectBar'
import { Collapse } from '@mui/material'

type Props = { select?: boolean; devices?: IDevice[] }

export const DevicesActionBars: React.FC<Props> = ({ select, devices }) => {
  const selected = useSelector((state: State) => state.ui.selected)
  const scriptForm = useSelector((state: State) => state.ui.scriptForm)

  return (
    <Collapse in={!!(select || selected.length)} mountOnEnter>
      {scriptForm ? <DevicesSelectBar /> : <DevicesActionBar devices={devices} />}
    </Collapse>
  )
}
