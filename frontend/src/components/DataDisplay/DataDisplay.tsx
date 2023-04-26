import React from 'react'
import { List, ListItem, Tooltip } from '@mui/material'
import { fontSizes } from '../../styling'
import { makeStyles } from '@mui/styles'
import { Attribute } from '../Attributes'
import { Icon } from '../Icon'

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
      {attributes.map(attribute => {
        if (limits && !attribute.show(limits)) return null
        const value = attribute.value(props)
        return (
          value != null && (
            <ListItem key={attribute.id} disableGutters>
              <span className={css.label}>
                {attribute.label}:
                {attribute.help && (
                  <Tooltip title={attribute.help}>
                    <Icon name="question-circle" size="sm" inline />
                  </Tooltip>
                )}
              </span>
              <span className={css.attribute}>{value}</span>
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
      fontSize: fontSizes.sm,
      fontFamily: 'Roboto Mono',
      color: palette.grayDarker.main,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }))
