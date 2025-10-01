import React from 'react'
import { List, ListItem, Tooltip } from '@mui/material'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { fontSizes } from '../../styling'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles(width)()
  if (!props) return null
  return (
    <List className={css.list} disablePadding={disablePadding}>
      {attributes.map((attribute, index) => {
        if (limits && !attribute.show(limits)) return null
        const value = attribute.value(props)
        return (
          value != null && (
            <ListItem key={index} disableGutters>
              <span className={css.label}>
                {attribute.label}:
                {attribute.help && (
                  <Tooltip title={attribute.help} placement="top" arrow>
                    <sup>
                      <Icon name="question-circle" size="xs" />
                    </sup>
                  </Tooltip>
                )}
              </span>
              <AttributeValue className={css.attribute} attribute={attribute} {...props} />
              {attribute.copyable && (
                <CopyIconButton
                  sx={{ marginY: -1 }}
                  size="sm"
                  color="gray"
                  title={`Copy ${attribute.label}`}
                  value={value}
                />
              )}
            </ListItem>
          )
        )
      })}
    </List>
  )
}

const useStyles = minWidth =>
  makeStyles(({ palette }) => ({
    list: {
      width: '100%',
      padding: `4px 0`,
    },
    label: {
      '& > :first-of-type': { alignSelf: 'start' },
      color: palette.grayDark.main,
      textTransform: 'capitalize',
      alignSelf: 'flex-start',
      minWidth,
    },
    attribute: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }))
