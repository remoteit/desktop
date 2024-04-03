import React from 'react'
import { Route, Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { selectLimits } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Pre } from './Pre'

const oneWeek = 1000 * 60 * 60 * 24 * 7

export const UpgradeNotice: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
  const limits = useSelector(selectLimits)
  const visible = useSelector(
    (state: State) => !state.ui.updateNoticeCleared || state.ui.updateNoticeCleared < Date.now() - oneWeek
  )
  const limit = limits.find(l => l.name === 'iot-devices')
  const overLimit = limit && limit.actual > limit.value
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!visible || !limit || !overLimit) return null

  let message = 'A license is required for commercial use. Personal use is free for up to 5 devices.'
  if (overLimit) message = `You have ${limit.actual} devices, but your plan only allows ${limit.value}.`

  return (
    <Route path="/devices">
      <Notice
        className={css.notice}
        severity="warning"
        onClose={() => dispatch.ui.setPersistent({ updateNoticeCleared: Date.now() })}
        button={
          <Link to="/account/plans">
            <Button variant="contained" color="warning" size="small">
              Upgrade
            </Button>
          </Link>
        }
      >
        {message}
      </Notice>
    </Route>
  )
}

const useStyles = makeStyles({
  notice: { zIndex: 9 },
})
