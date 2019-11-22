import React from 'react'
import { List, ListItem } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { colors, fontSizes } from '../../styling'

type Data = { label: string; value?: any }

export const DataDisplay: React.FC<{ data: Data[] }> = ({ data }) => {
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
    padding: 0,
    fontSize: fontSizes.sm,
    letterSpacing: 0.2,
    lineHeight: '2em',
    color: colors.grayDarker,
    '&>span': {
      color: colors.gray,
      width: 100,
    },
  },
})
