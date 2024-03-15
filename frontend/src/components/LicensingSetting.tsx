import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material'
import { LicensingIcon } from './LicensingIcon'
import { LicensingNotice } from './LicensingNotice'
import { ListItemCopy } from './ListItemCopy'
import { LimitSetting } from './LimitSetting'
import { Timestamp } from './Timestamp'

function sortLimits(a, b) {
  const order = ['iot-devices', 'org-users', 'tagging']
  const indexA = order.indexOf(a.name)
  const indexB = order.indexOf(b.name)
  if (indexA === -1) return 1 // a is not in the order array, it should come last
  if (indexB === -1) return -1 // b is not in the order array, it should come last
  return indexA - indexB // both are in the order array, sort them accordingly
}

export const LicensingSetting: React.FC<{ licenses: ILicense[]; limits?: ILimit[] }> = ({ licenses, limits = [] }) => {
  if (!licenses.length) return null
  return (
    <>
      {licenses.map((license, index) => (
        <List key={index} sx={{ maxWidth: 500 }}>
          <LicensingNotice license={license} />
          <ListItem key={license.id} dense>
            <ListItemIcon>
              <LicensingIcon license={license} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {license.plan.product.description}
                  &nbsp;{license.plan.description} plan
                </Typography>
              }
              secondary={
                !license.id
                  ? 'Not subscribed'
                  : license.expiration && (
                      <>
                        Renews <Timestamp date={license.expiration} variant="long" />
                      </>
                    )
              }
            />
          </ListItem>
          {!!(license.id || license.limits?.length) && (
            <ListItem>
              <ListItemIcon />
              <Box width="100%">
                {license.limits && (
                  <Box marginBottom={3} marginTop={1}>
                    {license.limits?.sort(sortLimits).map(limit => (
                      <LimitSetting key={limit.name} limit={limit} />
                    ))}
                  </Box>
                )}
                <ListItemCopy label="License Key" value={license.id} showBackground />
              </Box>
            </ListItem>
          )}
        </List>
      ))}
      <List sx={{ maxWidth: 500 }}>
        {limits.map(limit => (
          <ListItem key={limit.name}>
            <ListItemIcon />
            <LimitSetting limit={limit} />
          </ListItem>
        ))}
      </List>
    </>
  )
}
