import React from 'react'
import { Box, List, ListItem, Tooltip } from '@mui/material'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { Attribute } from '../Attributes'
import { Icon } from '../Icon'
import { AttributeValue } from '../AttributeValue'

type Props = IDataOptions & {
  attributes: Attribute[]
  limits?: ILookup<boolean>
  disablePadding?: boolean
  width?: number
}

export const DataDisplay: React.FC<Props> = ({ attributes, limits, width = 140, disablePadding, ...props }) => {
  if (!props) return null
  return (
    <List
      sx={{ width: '100%', padding: '4px 0', '& .ddAttribute': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
      disablePadding={disablePadding}
    >
      {attributes.map((attribute, index) => {
        if (limits && !attribute.show(limits)) return null
        const value = attribute.value(props)
        const copyValue = typeof value === 'string' || typeof value === 'number' ? value : undefined
        return (
          value != null && (
            <ListItem key={index} disableGutters>
              <Box
                component="span"
                sx={{
                  '& > :first-of-type': { alignSelf: 'start' },
                  color: 'grayDark.main',
                  textTransform: 'capitalize',
                  alignSelf: 'flex-start',
                  minWidth: width,
                }}
              >
                {attribute.label}:
                {attribute.help && (
                  <Tooltip title={attribute.help} placement="top" arrow>
                    <sup>
                      <Icon name="question-circle" size="xs" />
                    </sup>
                  </Tooltip>
                )}
              </Box>
              <AttributeValue className="ddAttribute" attribute={attribute} {...props} />
              {attribute.copyable && (
                <CopyIconButton
                  sx={{ marginY: -1 }}
                  size="sm"
                  color="gray"
                  title={`Copy ${attribute.label}`}
                  value={copyValue}
                />
              )}
            </ListItem>
          )
        )
      })}
    </List>
  )
}
