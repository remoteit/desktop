import React from 'react'
import { ListItem, ListItemIcon, Box } from '@mui/material'
import { ListItemCopy } from './ListItemCopy'
import { LimitSetting } from './LimitSetting'

function sortLimits(a, b) {
  const order = ['iot-devices', 'org-users', 'tagging']
  const indexA = order.indexOf(a.name)
  const indexB = order.indexOf(b.name)
  if (indexA === -1) return 1 // a is not in the order array, it should come last
  if (indexB === -1) return -1 // b is not in the order array, it should come last
  return indexA - indexB // both are in the order array, sort them accordingly
}

export const LimitsSetting: React.FC<{ limits?: ILimit[]; id?: string }> = ({ limits = [], id }) => {
  if (!id && !limits?.length) return null
  return (
    <ListItem>
      <ListItemIcon />
      <Box width="100%">
        {!!limits.length && (
          <Box marginBottom={3} marginTop={1}>
            {[...limits].sort(sortLimits).map(limit => (
              <LimitSetting key={limit.name} limit={limit} />
            ))}
          </Box>
        )}
        {id && <ListItemCopy label="License Key" value={id} showBackground />}
      </Box>
    </ListItem>
  )
}
