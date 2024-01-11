import React from 'react'
import { Route, Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { selectPlan, selectRemoteitLicense } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { deviceUserTotal } from '../models/plans'
import { getOwnDevices } from '../selectors/devices'
import { Pre } from './Pre'

const oneWeek = 1000 * 60 * 60 * 24 * 7

export const UpgradeNotice: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
  const { plan, license, ownDevices, visible } = useSelector((state: ApplicationState) => ({
    plan: selectPlan(state),
    license: selectRemoteitLicense(state),
    ownDevices: getOwnDevices(state).filter(d => d.owner.id === state.user.id),
    visible: !state.ui.updateNoticeCleared || state.ui.updateNoticeCleared < Date.now() - oneWeek,
  }))
  const totals = deviceUserTotal(license?.quantity || 1, plan)
  const overLimit = ownDevices.length > totals.devices
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!visible || !plan || !overLimit) return null

  let message = 'A license is required for commercial use. Personal use is free for up to 5 devices.'
  if (overLimit) message = `You have ${ownDevices.length} devices, but your plan only allows ${totals.devices}.`

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
