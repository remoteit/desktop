import React from 'react'
import { Link } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { selectLimit } from '../../selectors/organizations'
import { State, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { List, Box, Button, Typography } from '@mui/material'
import { fontSizes, spacing } from '../../styling'
import { humanizeDays, limitDays } from '../../models/plans'
import { EventItem } from './EventItem'
import { BillingUI } from '../BillingUI'
import { Notice } from '../Notice'

export interface LogListProps {
  device?: IDevice
}

export const EventList: React.FC<LogListProps> = ({ device }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.user)
  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const { events, planUpgrade, fetching, fetchingMore } = useSelector((state: State) => state.logs)

  const fetchMore = async () => {
    const allowedDays = Math.max(limitDays(logLimit?.value) || 0, 0)
    await dispatch.logs.set({ after: events?.last })
    await dispatch.logs.fetch({ allowedDays, deviceId: device?.id })
  }

  const showPlanUpgradeNotice = Boolean(planUpgrade && !fetching && !fetchingMore)

  return (
    <>
      <List className={css.item}>
        {events?.items?.map((item, index) => (
          <EventItem item={item} device={device} user={user} key={index} />
        ))}
      </List>
      {showPlanUpgradeNotice ? (
        <Notice
          severity="warning"
          button={
            <BillingUI>
              <Button to="/account/plans" variant="contained" color="warning" size="small" component={Link}>
                Upgrade
              </Button>
            </BillingUI>
          }
        >
          Plan upgrade required to view logs past {humanizeDays(logLimit?.value)}.
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
            <Typography variant="caption" align="center" sx={{ opacity: 0.5 }}>
              End of logs
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
