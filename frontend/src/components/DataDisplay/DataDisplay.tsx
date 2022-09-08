import React from 'react'
import { List, ListItem, Tooltip } from '@mui/material'
import { fontSizes } from '../../styling'
import { makeStyles } from '@mui/styles'
import { Attribute } from '../Attributes'
import { Icon } from '../Icon'

type Props = IDataOptions & {
  attributes: Attribute[]
  limits?: ILookup<boolean>
  device?: IDevice
  service?: IService
  disablePadding?: boolean
  width?: number
}

export const DataDisplay: React.FC<Props> = ({ attributes, limits, width = 140, disablePadding, ...props }) => {
  const css = useStyles(width)()
  if (!props) return null
  return (
    <List className={css.list} disablePadding={disablePadding}>
      {attributes.map(attribute => {
        if (limits && !attribute.show(limits)) return null
        const value = attribute.value(props)
        return (
          value != null && (
            <ListItem className={css.item} key={attribute.label} disableGutters>
              <span>
                {attribute.label}:
                {attribute.help && (
                  <Tooltip title={attribute.help}>
                    <Icon name="question-circle" size="sm" inline />
                  </Tooltip>
                )}
              </span>
              {value}
            </ListItem>
          )
        )
      })}
    </List>
  )
}

const useStyles = minWidth =>
  makeStyles(({ palette }) => ({
    list: { width: '100%' },
    item: {
      padding: `4px 0`,
      fontSize: fontSizes.sm,
      fontFamily: 'Roboto Mono',
      color: palette.grayDarker.main,
      '& > :first-of-type': { alignSelf: 'start' },
      '& > span': {
        fontFamily: 'Roboto',
        color: palette.grayDark.main,
        textTransform: 'capitalize',
        minWidth,
      },
    },
  }))
