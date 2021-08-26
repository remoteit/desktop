import React from 'react'
import {
  makeStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Box,
  Divider,
} from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { selectLicenses } from '../models/licensing'
import { LicensingIcon } from './LicensingIcon'
import { LicensingNotice } from './LicensingNotice'
import { ListItemCopy } from './ListItemCopy'
import { LimitSetting } from './LimitSetting'
import { spacing } from '../styling'
import { Quote } from './Quote'

export const LicensingSetting: React.FC = () => {
  const { licenses, limits } = useSelector((state: ApplicationState) => selectLicenses(state))
  const css = useStyles()

  if (!licenses.length) return null

  return (
    <>
      {licenses.map((license, index) => (
        <React.Fragment key={index}>
          <List>
            <LicensingNotice license={license} />
            <ListItem key={license.id} dense>
              <ListItemIcon>
                <LicensingIcon license={license} />
              </ListItemIcon>
              <ListItemText
                primary={`${license.plan.product.description} ${license.plan.description} plan`}
                secondary={
                  !license.id
                    ? 'Not subscribed'
                    : license.expiration && `Valid until ${license.expiration.toLocaleString(undefined, dateOptions)}`
                }
              />
              <ListItemSecondaryAction>
                {license.id ? (
                  license.upgradeUrl && (
                    <Button color="primary" href={license.upgradeUrl} size="small" target="_blank">
                      Manage Subscription
                    </Button>
                  )
                ) : (
                  <Button color="primary" href={license.upgradeUrl} size="small" target="_blank">
                    Free Trial
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
            {!!(license.id || license.limits.length) && (
              <ListItem>
                <ListItemIcon></ListItemIcon>
                <Quote margin={0}>
                  <Box width={400}>
                    {license.limits.map(limit => (
                      <LimitSetting key={limit.name} limit={limit} />
                    ))}
                  </Box>
                  <ListItemCopy label="License Key" value={license.id} />
                </Quote>
              </ListItem>
            )}
          </List>
          <Divider className={css.divider} />
        </React.Fragment>
      ))}
      {!!limits.length && (
        <List>
          {limits.map(limit => (
            <ListItem key={limit.name}>
              <ListItemIcon></ListItemIcon>
              <LimitSetting limit={limit} />
            </ListItem>
          ))}
        </List>
      )}
    </>
  )
}

const useStyles = makeStyles({
  divider: { margin: `${spacing.sm}px ${spacing.xl}px ${spacing.xs}px 80px` },
})
