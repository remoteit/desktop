import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { colors, fontSizes } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Duration } from '../../components/Duration'
import { Icon } from '../Icon'

export const DataDisplay: React.FC<{ data: IDataDisplay[] }> = ({ data }) => {
  const css = useStyles()

  return (
    <List>
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
              {item.format ? formats[item.format](item.value) : item.value}
            </ListItem>
          )
      )}
    </List>
  )
}

const formats = {
  duration: (date: Date) => {
    if (date instanceof Date) return <Duration startTime={date.getTime()} ago />
  },
  percent: (value: number) => {
    if (value) return Math.round(value) + '%'
  },
  round: (value: number) => {
    return Math.round(value * 10) / 10
  },
  location: (geo: IDevice['geo']) => {
    if (!geo) return null
    return (
      <>
        {geo.city}
        <br />
        {geo.stateName}
        <br />
        {geo.countryName}
      </>
    )
  },
}

const useStyles = makeStyles({
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
    '& .fal': {
      color: colors.grayDarker,
    },
  },
})
