import React from 'react'
import { State } from '../store'
import { Switch, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DevicesActionBar } from './DevicesActionBar'
import { DevicesSelectBar } from './DevicesSelectBar'
import { Collapse } from '@mui/material'

type Props = { select?: boolean; devices?: IDevice[] }

export const DevicesActionBars: React.FC<Props> = ({ select, devices }) => {
  const selected = useSelector((state: State) => state.ui.selected)

  return (
    <Switch>
      <Route path="/devices/select/scripts">
        <DevicesSelectBar />
      </Route>
      <Route>
        <Collapse in={!!(select || selected.length)} mountOnEnter>
          <DevicesActionBar devices={devices} />
        </Collapse>
      </Route>
    </Switch>
  )
}
