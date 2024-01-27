import React from 'react'
import { Link } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { List, Box, Button, Typography } from '@mui/material'
import { fontSizes, spacing } from '../../styling'
import { selectLimit, humanizeDays } from '../../models/plans'
import { EventItem } from './EventItem'
import { Notice } from '../Notice'
import { Pre } from '../Pre'

export interface LogListProps {
  device?: IDevice
}

export const EventList: React.FC<LogListProps> = ({ device }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.user)
  const logLimit = useSelector((state: State) => selectLimit('log-limit', state) || 'P1W')
  const { events, planUpgrade, fetching, fetchingMore } = useSelector((state: State) => state.logs)

  const fetchMore = async () => {
    await dispatch.logs.set({ deviceId: device?.id, after: events?.last })
    await dispatch.logs.fetch()
  }

  return (
    <>
      <List className={css.item}>
        {events?.items?.map((item, index) => (
          <EventItem item={item} device={device} user={user} key={index} />
        ))}
      </List>
      {!events?.hasMore && !fetching && planUpgrade ? (
        <Notice
          severity="warning"
          button={
            <Button to="/account/plans" variant="contained" color="warning" size="small" component={Link}>
              Upgrade
            </Button>
          }
        >
          Plan upgrade required to view logs past {humanizeDays(logLimit)}.
        </Notice>
      ) : (
        <Box className={css.box}>
          {fetching || fetchingMore ? (
            <Button color="primary" disabled size="small">
              Loading...
            </Button>
          ) : events?.hasMore ? (
            <Button color="primary" onClick={fetchMore} variant="contained" size="small">
              Load More
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

const useStyles = makeStyles(({ palette, breakpoints }) => ({
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
        [breakpoints.down('sm')]: { minWidth: 100, width: 100 },
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
