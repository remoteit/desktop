import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { colors, fontSizes } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Attribute } from '../../helpers/attributes'
import { Icon } from '../Icon'

type Props = IDataOptions & {
  attributes: Attribute[]
  width?: number
}

export const DataDisplay: React.FC<Props> = ({ attributes, width = 140, ...props }) => {
  const css = useStyles(width)()
  if (!props) return null
  return (
    <List className={css.list}>
      {attributes.map(attribute => {
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
  makeStyles({
    list: { width: '100%' },
    item: {
      padding: `4px 0`,
      fontSize: fontSizes.sm,
      fontFamily: 'Roboto Mono',
      color: colors.grayDarker,
      alignItems: 'start',
      '& > span': {
        fontFamily: 'Roboto',
        color: colors.grayDark,
        textTransform: 'capitalize',
        minWidth,
      },
    },
  })
