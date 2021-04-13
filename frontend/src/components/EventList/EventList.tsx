import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { List, Box, Button, makeStyles, Typography } from '@material-ui/core'
import { Notice } from '../Notice'
import { colors, fontSizes, spacing } from '../../styling'
import { EventItem } from './EventItem'

export interface LogListProps {
  fetching: boolean
  device?: IDevice
  events?: IEventList
  fetchingMore: boolean
  onFetchMore?: () => void
}

export const EventList: React.FC<LogListProps> = ({ fetching, device, events, fetchingMore, onFetchMore }) => {
  const { user, daysAllowed, planUpgrade} = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    daysAllowed: state.logs.daysAllowed,
    planUpgrade: state.logs.planUpgrade
  }))
  const css = useStyles()

  return (
    <>
      <List className={css.item}>
        {!fetching &&
          events?.items?.map((item: any) => <EventItem item={item} device={device} user={user} key={item.id} />)}
      </List>
      <Box className={css.box}>
        {events?.hasMore || fetching ? (
          <Button color="primary" onClick={() => onFetchMore && onFetchMore()} disabled={fetchingMore || fetching}>
            {fetchingMore || fetching ? `Loading ...` : 'Load More'}
          </Button>
        ) : (
          <Typography variant="body2" align="center" color="textSecondary">
            End of Logs
          </Typography>
        )}
      </Box>
      {!events?.hasMore && !fetching && planUpgrade && (
        <Notice
          severity="warning"
          button={
            <Button variant="contained" href="https://link.remote.it/licensing/plans" size="small" target="_blank">
              Upgrade
            </Button>
          }
        >
          Plan upgrade required to view logs past {daysAllowed} days
        </Notice>
      )}
    </>
  )
}

const useStyles = makeStyles({
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
