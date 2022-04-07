import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Button, Box } from '@material-ui/core'
import { dateOptions } from './Duration/Duration'
import { LicensingIcon } from './LicensingIcon'
import { LicensingNotice } from './LicensingNotice'
import { DataCopy } from './DataCopy'
import { LimitSetting } from './LimitSetting'
import { Link } from 'react-router-dom'

export const LicensingSetting: React.FC<{ licenses: ILicense[]; limits?: ILimit[] }> = ({ licenses, limits = [] }) => {
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
                    : license.expiration && `Renews ${license.expiration.toLocaleString(undefined, dateOptions)}`
                }
              />
              <ListItemSecondaryAction>
                {license.managePath && (
                  <Link to={license.managePath}>
                    <Button color="primary" size="small">
                      {license.id ? 'Manage' : 'Free Trial'}
                    </Button>
                  </Link>
                )}
              </ListItemSecondaryAction>
            </ListItem>
            {!!(license.id || license.limits?.length) && (
              <ListItem>
                <ListItemIcon />
                <Box>
                  {license.limits && (
                    <Box width={400} marginBottom={3} marginTop={1}>
                      {license.limits?.map(limit => (
                        <LimitSetting key={limit.name} limit={limit} />
                      ))}
                    </Box>
                  )}
                  <DataCopy label="License Key" value={license.id} showBackground />
                </Box>
              </ListItem>
            )}
          </List>
        </React.Fragment>
      ))}
      <List>
        {limits.map(limit => (
          <ListItem key={limit.name}>
            <ListItemIcon></ListItemIcon>
            <LimitSetting limit={limit} />
          </ListItem>
        ))}
      </List>
    </>
  )
}
