import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { colors, fontSizes, spacing } from '../../styling'
import { Icon } from '../Icon'

export const DataDisplay: React.FC<{ data: IDataDisplay[] }> = ({ data }) => {
  const css = useStyles()

  return (
    <List>
      {data.map(item => (
        <ListItem className={css.item} key={item.label}>
          <span>
            {item.label}
            {item.help && (
              <Tooltip title={item.help}>
                <Icon name="question-circle" weight="light" size="sm" inline />
              </Tooltip>
            )}
            :
          </span>
          {item.value || '-'}
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  item: {
    padding: `${spacing.xxs}px 0`,
    fontSize: fontSizes.sm,
    fontFamily: 'Roboto Mono',
    color: colors.grayDarker,
    alignItems: 'start',
    '& > span': {
      fontFamily: 'Roboto',
      color: colors.grayDark,
      width: 142,
    },
    '& .fal': {
      color: colors.grayDarker,
    },
  },
})
