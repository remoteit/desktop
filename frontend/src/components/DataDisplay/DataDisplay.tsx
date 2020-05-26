import React from 'react'
import { List, ListItem, Tooltip } from '@material-ui/core'
import { colors, fontSizes, spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Duration } from '../../components/Duration'
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
          {item.format ? formats[item.format](item.value) : item.value || '-'}
        </ListItem>
      ))}
    </List>
  )
}

const formats = {
  duration: (date: Date) => {
    if (typeof date === 'object') return <Duration startTime={date.getTime()} ago />
  },
  percent: (value: number) => {
    if (value) return Math.round(value) + '%'
  },
  round: (value: number) => {
    return Math.round(value * 10) / 10
  },
  location: (geo: IDevice['geo']) => {
    if (!geo) return null
    return [geo.city, geo.stateName, geo.countryName].map(value => (
      <>
        {value}
        <br />
      </>
    ))
  },
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
