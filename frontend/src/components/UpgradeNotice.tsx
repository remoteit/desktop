import React from 'react'
import { Route, Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getOwnDevices } from '../selectors/devices'
import { selectRemoteitLicense } from '../selectors/organizations'
import { PERSONAL_PLAN_ID } from '../models/plans'

const oneWeek = 1000 * 60 * 60 * 24 * 7

export const UpgradeNotice: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const { license, ownDevices, visible } = useSelector((state: ApplicationState) => ({
    license: selectRemoteitLicense(state),
    ownDevices: getOwnDevices(state).filter(d => d.owner.id === state.user.id),
    visible: !state.ui.updateNoticeCleared || state.ui.updateNoticeCleared < Date.now() - oneWeek,
  }))
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!visible || !license || license.plan.id !== PERSONAL_PLAN_ID || !ownDevices.length) return null

  return (
    <Route path={['/devices', '/connections', '/networks']}>
      <Notice
        className={css.notice}
        severity="warning"
        onClose={() => dispatch.ui.setPersistent({ updateNoticeCleared: Date.now() })}
        button={
          <Link to="/account/plans">
            <Button variant="contained" color="warning" size="small">
              Subscribe
            </Button>
          </Link>
        }
      >
        A license is required for commercial use. Personal use is free for up to 5 devices.
      </Notice>
    </Route>
  )
}

const useStyles = makeStyles({
  notice: { zIndex: 9 },
})
