import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { List, Box, Button, makeStyles, Typography } from '@material-ui/core'
import { fontSizes, spacing } from '../../styling'
import { getLimit, humanizeDays } from '../../models/licensing'
import { EventItem } from './EventItem'
import { Notice } from '../Notice'

export interface LogListProps {
  device?: IDevice
}

export const EventList: React.FC<LogListProps> = ({ device }) => {
  const css = useStyles()
  const { logs } = useDispatch<Dispatch>()
  const { events, from, size, minDate, selectedDate, planUpgrade, fetching, fetchingMore, user, logLimit } =
    useSelector((state: ApplicationState) => ({
      ...state.logs,
      user: state.auth.user,
      logLimit: getLimit('log-limit', state) || 'P1W',
    }))

  const fetchMore = () => {
    logs.set({ deviceId: device?.id, from: from + size, minDate, maxDate: selectedDate })
    logs.fetch()
  }

  return (
    <>
      <List className={css.item}>
        {events?.items?.map((item: any) => (
          <EventItem item={item} device={device} user={user} key={item.id} />
        ))}
      </List>
      {!events?.hasMore && !fetching && planUpgrade ? (
        <Notice
          severity="warning"
          button={
            <Button variant="contained" href="https://link.remote.it/portal/account" size="small" target="_blank">
              Upgrade
            </Button>
          }
        >
          Plan upgrade required to view logs past {humanizeDays(logLimit)}.
        </Notice>
      ) : (
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
      )}
    </>
  )
}

const useStyles = makeStyles( ({ palette }) => ({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: 100,
  },
  item: {
    '& li': {
      padding: `4px 0`,
      fontSize: fontSizes.sm,
      color: palette.grayDark.main,
      alignItems: 'start',
      '& > span': {
        fontSize: fontSizes.xxs,
        textAlign: 'right',
        fontFamily: 'Roboto Mono',
        minWidth: 150,
      },
      '& b': {
        color: palette.grayDarkest.main,
        fontWeight: 400,
      },
      '& i': {
        color: palette.grayDarker.main,
        fontStyle: 'normal',
      },
    },
  },
}))
