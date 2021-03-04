import React from 'react'
import {
  makeStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Button,
  Box,
} from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { selectLicenses } from '../models/licensing'
import { LicensingIcon } from './LicensingIcon'
import { LicensingNotice } from './LicensingNotice'
import { LimitSetting } from './LimitSetting'
import { spacing } from '../styling'

export const LicensingSetting: React.FC = () => {
  const { licenses, limits, upgradeUrl } = useSelector((state: ApplicationState) => selectLicenses(state))
  const css = useStyles()

  if (!licenses.length) return null

  return (
    <>
      {licenses.map((license, index) => (
        <React.Fragment key={index}>
          <LicensingNotice license={license} />
          <ListItem key={license.id} dense>
            <ListItemIcon>
              <LicensingIcon license={license} />
            </ListItemIcon>
            <ListItemText
              primary={`${license.plan.product.description} ${license.plan.description} plan`}
              secondary={
                license.expiration && `Valid until ${license.expiration.toLocaleString(undefined, dateOptions)}`
              }
            />
            <ListItemSecondaryAction>
              <Button color="primary" href={upgradeUrl} size="small" target="_blank">
                Manage Subscription
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemIcon></ListItemIcon>
            <Box width={400}>
              {license.limits.map(limit => (
                <LimitSetting key={limit.name} limit={limit} />
              ))}
            </Box>
          </ListItem>
        </React.Fragment>
      ))}
      {!!limits.length && <Divider className={css.divider} />}
      {limits.map(limit => (
        <ListItem key={limit.name}>
          <ListItemIcon></ListItemIcon>
          <LimitSetting limit={limit} />
        </ListItem>
      ))}
    </>
  )
}

const useStyles = makeStyles({
  divider: { margin: `${spacing.sm}px ${spacing.xl}px ${spacing.xs}px 73px` },
})
