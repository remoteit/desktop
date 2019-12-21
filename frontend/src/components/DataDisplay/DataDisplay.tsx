import React from 'react'
import { List, ListItem } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { colors, fontSizes, spacing } from '../../styling'

export const DataDisplay: React.FC<{ data: IDataDisplay[] }> = ({ data }) => {
  const css = useStyles()

  return (
    <List>
      {data.map(item => (
        <ListItem className={css.item} key={item.label}>
          <span>{item.label}:</span>
          {item.value}
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
    '&>span': {
      fontFamily: 'Roboto',
      color: colors.gray,
      width: 100,
    },
  },
})
