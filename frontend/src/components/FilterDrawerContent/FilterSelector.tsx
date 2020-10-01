import { Divider, List, ListItem, ListItemIcon, ListItemText, makeStyles, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { colors, spacing } from '../../styling'
import { Icon } from '../Icon'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Theme } from 'react-select'

export function FilterSelector({
  subtitle,
  filterList,
}: {
  subtitle: string
  filterList: { value: string; filterName: string }[]
}): JSX.Element {
  const { devices } = useDispatch<Dispatch>()
  const { filter, sort, owner } = useSelector((state: ApplicationState) => state.devices)
  const [sortSelection, setSortSelection] = useState('sort-amount-down')

  useEffect(() => {}, [sortSelection])

  const handleChange = (subtitle: string, value: string) => {
    let valueSort
    if (subtitle === 'Sort') {
      if (value === sort && sortSelection === 'sort-amount-down') {
        setSortSelection('sort-amount-up')
        valueSort = `-${value}`
      } else if (value === sort && sortSelection === 'sort-amount-up') {
        setSortSelection('sort-amount-down')
        valueSort = value
      } else {
        setSortSelection('sort-amount-down')
        valueSort = value
      }
    }
    devices.set({
      filter: subtitle === 'Device State' ? value : filter,
      sort: subtitle === 'Sort' ? valueSort : sort,
      owner: subtitle === 'Owner' ? value : owner,
      from: 0,
    })
    devices.fetch()
  }

  function TheIcon(props: { value: string; subtitle: string }) {
    let iconName: string
    switch (props.subtitle) {
      case 'Sort':
        iconName = sortSelection
        if (props.value === sort || `-${props.value}` === sort) {
          return <Icon name={iconName} color="primary" />
        }
        break
      case 'Device State':
        iconName = 'check'
        if (props.value === filter) {
          return <Icon name={iconName} color="primary" />
        }
        break
      case 'Owner':
        iconName = 'check'
        if (props.value === owner) {
          return <Icon name={iconName} color="primary" />
        }
        break
    }
    return null
  }

  function TheFilter(props: { value: string; filterName: string }) {
    if (props.value === owner || props.value === filter || props.value === sort) {
      return (
        <Typography color="primary">
          <ListItemText className={css.name} primary={props.filterName} />
        </Typography>
      )
    }
    return (
      <Typography>
        <ListItemText className={css.name} primary={props.filterName} />
      </Typography>
    )
  }

  const css = useStyles()

  return (
    <>
      <Divider />
      <Typography variant="subtitle1" className={css.subtitle}>
        {subtitle}
      </Typography>
      <List className={css.list}>
        {filterList.map((f, index) => {
          return (
            <ListItem
              button
              className={css.listName}
              key={index}
              onClick={() => {
                handleChange(subtitle, f.value)
              }}
            >
              <ListItemIcon>
                <TheIcon value={f.value} subtitle={subtitle} />
              </ListItemIcon>
              <TheFilter value={f.value} filterName={f.filterName} />
            </ListItem>
          )
        })}
      </List>
    </>
  )
}

const useStyles = makeStyles({
  subtitle: {
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
    minHeight: 0,
  },
  title: {
    flexGrow: 1,
  },
  list: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  listName: {
    padding: 0,
    '&:hover': {
      background: colors.primaryHighlight,
    },
  },
  name: {
    fontSize: '13px',
  },
})

const selectTheme = (theme: Theme) => {
  return {
    ...theme,
    borderRadius: spacing.xs,
    colors: {
      ...theme.colors,
      primary25: colors.primaryHighlight,
      primary: colors.primary,
    },
  }
}
