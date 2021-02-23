import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { colors, fontSizes } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Formats } from '../Formats'
import { Icon } from '../Icon'

export const DataDisplay: React.FC<{ data: IDataDisplay[] }> = ({ data }) => {
  const css = useStyles()

  return (
    <List className={css.list}>
      {data.map(
        item =>
          item.value != null && (
            <ListItem className={css.item} key={item.label}>
              <span>
                {item.label}:
                {item.help && (
                  <Tooltip title={item.help}>
                    <Icon name="question-circle" type="light" size="sm" inline />
                  </Tooltip>
                )}
              </span>
              {item.format ? Formats[item.format](item.value) : item.value}
            </ListItem>
          )
      )}
    </List>
  )
}

const useStyles = makeStyles({
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
      minWidth: 142,
      textTransform: 'capitalize',
    },
    '& svg': {
      color: colors.grayDarker,
    },
  },
})
