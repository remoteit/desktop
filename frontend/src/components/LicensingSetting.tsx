import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { LicensingNotice } from './LicensingNotice'
import { LicensingIcon } from './LicensingIcon'
import { LimitsSetting } from './LimitsSetting'
import { Timestamp } from './Timestamp'

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
          <LimitsSetting limits={license.limits} id={license.id} />
        </List>
      ))}
      {!!limits.length && (
        <List sx={{ maxWidth: 500 }} disablePadding>
          <LimitsSetting limits={limits} />
        </List>
      )}
    </>
  )
}
