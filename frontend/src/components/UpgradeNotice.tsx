import React from 'react'
import { Route, Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getOwnDevices } from '../selectors/devices'
import { selectRemoteitLicense } from '../selectors/plans'
import { PERSONAL_PLAN_ID } from '../models/plans'

export const UpgradeNotice: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const { license, ownDevices } = useSelector((state: ApplicationState) => ({
    license: selectRemoteitLicense(state),
    ownDevices: getOwnDevices(state).filter(d => d.owner.id === state.user.id),
  }))
  const css = useStyles()

  if (!license || license.plan.id !== PERSONAL_PLAN_ID || !ownDevices.length) return null

  return (
    <Route path={['/devices', '/connections', '/networks']}>
      <Notice
        className={css.notice}
        severity="warning"
        button={
          <Link to="/account/plans">
            <Button variant="contained" color="warning" size="small">
              Subscribe
            </Button>
          </Link>
        }
      >
        Commercial use requires a license after your first registered device.
      </Notice>
    </Route>
  )
}

const useStyles = makeStyles({
  notice: { zIndex: 9 },
})
