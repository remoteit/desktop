import React from 'react'
import {  ListItemIcon, Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import { ListItemLocation } from '../ListItemLocation'


export const AdvanceSetting: React.FC<{ service: IService }> = ({ service }) => {


  return (
    <ListItemLocation pathname="/settings/addvancedSettings" >
      <ListItemIcon>
        <Icon className="primary" name="cog" size="md" type="light" />
      </ListItemIcon>
      <Typography variant="subtitle1" style={{ paddingLeft: 0, paddingBottom: 15 }} className="primary"> addvanced settings</Typography>
    </ListItemLocation>

  )
}
