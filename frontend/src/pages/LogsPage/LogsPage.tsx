import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import {
  Typography,
  Box,
  Breadcrumbs,
  List,
  Button,
  Tooltip,
  IconButton,
  Link,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { colors, fontSizes, spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'

import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { EventCell } from '../DeviceLogPage/DeviceLogPage'
import { DateTime } from 'luxon'

const DAY = 1000 * 60 * 60 * 24

export const LogsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const [itemOffset, setItemOffset] = useState(0)
  const pageSize = 100
  const [lastUpdated, setLastUpdated] = useState<DateTime>(DateTime.local())

  const { getEventsLogs } = dispatch.logs
  const { events, fetchingMore, fetching, items, limits } = useSelector((state: ApplicationState) => {
    return {
      events: state.logs.events,
      fetchingMore: state.logs.fetchingMore,
      fetching: state.logs.fetching,
      items: state.logs?.events?.items,
      limits: state.licensing.limits,
    }
  })

  let limitDays = 0
  let logLimit = (limits && limits?.filter(limit => limit.name === 'log-limit')[0].value.toString()) || '0'
  let limitNumber = (logLimit && logLimit.replace(/\D/g, '')) || '0'

  switch (logLimit.slice(-1)) {
    case 'D':
      limitDays = limitNumber
      break
    case 'M':
      limitDays = limitNumber.parseInt() * 30
      break
    case 'Y':
      limitDays = limitNumber.parseInt() * 365
      break
    default:
      limitDays = 7
      break
  }

  const minDay = new Date(new Date().getTime() - DAY * limitDays)
  minDay.setHours(0)

  useEffect(() => {
    getEventsLogs({ id: '', from: itemOffset, minDate: `${minDay}` })
    console.log('Get Events Logs from: ', itemOffset)
  }, [itemOffset])

  const refresh = () => {
    if (itemOffset != 0) {
      setItemOffset(0)
    }
  }

  const fetchMore = () => {
    setItemOffset(itemOffset + pageSize)
  }

  return (
    <Container
      bodyProps={{ inset: true }}
      header={
        <>
          <Breadcrumbs />

          <List className={css.header}>
            <Typography variant="h1">
              <Icon name="file-alt" color="grayDarker" size="lg" />
              <Title inline>Logs</Title>
            </Typography>
            <ListItemSecondaryAction>
              <Box ml="auto" display="flex" alignItems="center">
                <i className={css.dateUpdate}> {'Updated ' + lastUpdated.toLocaleString(DateTime.DATETIME_MED)} </i>
                <CSVDownloadButton minDate={minDay?.toDateString() || new Date().toString()} />
                <Tooltip title="Refresh List">
                  <IconButton onClick={refresh}>
                    <Icon name="sync" spin={fetching} size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemSecondaryAction>
          </List>
        </>
      }
    >
      <List className={css.item}>
        {!fetching && items?.map((item: any) => <EventCell item={item} device={item.devices[0]} key={item.id} />)}
      </List>

      <Box className={css.box}>
        {events?.hasMore || fetching ? (
          <Button color="primary" onClick={fetchMore} disabled={fetchingMore || fetching}>
            {fetchingMore || fetching ? `Loading ...` : 'Load More'}
          </Button>
        ) : (
          <Typography variant="body2" align="center" color="textSecondary">
            End of Logs
          </Typography>
        )}
      </Box>

      {!events?.hasMore && !fetching && (
        <Typography variant="body2" align="center" color="textSecondary">
          Plan upgrade required to view logs past {limitDays} days <br />
          <Link onClick={() => window.open('https://link.remote.it/licensing/plans')}>Learn more</Link>
        </Typography>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  header: {
    paddingTop: 0,
  },
  textField: {
    display: 'block',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
    width: 200,
  },
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: 100,
  },
  dateUpdate: {
    fontSize: fontSizes.xxs,
    marginRight: spacing.sm,
  },
  item: {
    paddingTop: 0,
    '& li': {
      padding: `4px 0`,
      fontSize: fontSizes.sm,
      color: colors.grayDark,
      alignItems: 'start',
      '& > span': {
        fontSize: fontSizes.xxs,
        textAlign: 'right',
        fontFamily: 'Roboto Mono',
        minWidth: 150,
      },
      '& b': {
        color: colors.grayDarkest,
        fontWeight: 400,
      },
      '& i': {
        color: colors.grayDarker,
        fontStyle: 'normal',
      },
    },
  },
})
