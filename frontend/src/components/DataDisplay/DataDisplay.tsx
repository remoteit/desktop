import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { colors, fontSizes } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Attribute } from '../../helpers/attributes'
import { Icon } from '../Icon'

export const DataDisplay: React.FC<{ attributes: Attribute[]; device?: IDevice; service?: IService; width?: number }> =
  ({ attributes, device, service, width = 140 }) => {
    const css = useStyles(width)()
    if (!device) return null
    return (
      <List className={css.list}>
        {attributes.map(attribute => {
          return (
            attribute.value != null && (
              <ListItem className={css.item} key={attribute.label} disableGutters>
                <span>
                  {attribute.label}:
                  {attribute.help && (
                    <Tooltip title={attribute.help}>
                      <Icon name="question-circle" size="sm" inline />
                    </Tooltip>
                  )}
                </span>
                {attribute.value({ device, service })}
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
      '& svg': {
        color: colors.grayDarker,
      },
    },
  })
