import React, { useState } from 'react'
import classnames from 'classnames'
import sleep from '../services/sleep'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles } from '@mui/styles'
import { useDispatch, useSelector } from 'react-redux'
import { setConnection } from '../helpers/connectionHelper'
import { Typography, Collapse, Paper, Button } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { IconButton } from '../buttons/IconButton'
import { Duration } from './Duration'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

const SUCCESS_DISMISS = 1000
const FEEDBACK_DISMISS = 15000
const formId = '1FAIpQLSeYtHBGJ8MQ-9I70_ggngkL4S3PcxoIluAds-f9i44CbjKBzg'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ConnectionSurvey: React.FC<Props> = ({ connection }) => {
  const user = useSelector((state: ApplicationState) => state.user)
  const dispatch = useDispatch<Dispatch>()
  const [rated, setRated] = useState<number | null>(null)
  const css = useStyles()

  if (!connection) return null

  const show =
    connection.surveyed !== connection.sessionId &&
    !connection.connected &&
    Date.now() - (connection.endTime || 0) < 1000 * 60 * 60 // one hour

  const handleRating = async (rating: number) => {
    // call api to rate connection
    setRated(rating)
    dispatch.connections.survey({ rating, connection })
    if (rating === 100) {
      await sleep(SUCCESS_DISMISS)
    } else {
      await sleep(FEEDBACK_DISMISS)
    }
    resetRating()
  }

  const resetRating = async () => {
    setConnection({
      ...connection,
      surveyed: connection.sessionId,
    })
    await sleep(400)
    setRated(null)
  }

  const sendFeedback = () => {
    windowOpen(
      `https://docs.google.com/forms/d/e/${formId}/viewform?usp=pp_url&entry.1949454489=${user.email}&entry.993582460=${connection.id}&entry.1469201150=${connection.sessionId}&entry.2043964401=${connection.startTime}`
    )
  }

  return (
    <Collapse in={show}>
      <Gutters bottom={null} size="md">
        {rated === 100 ? (
          <Paper elevation={0} className={classnames(css.layout, css.survey)}>
            <Typography variant="body2">Thank you for your feedback!</Typography>
          </Paper>
        ) : rated === 50 || rated === 0 ? (
          <Paper elevation={0} className={css.layout}>
            <IconButton size="sm" name="times" onClick={resetRating} />
            <Typography variant="subtitle2" gutterBottom>
              Let us know what happened.
            </Typography>
            <Typography variant="body2" gutterBottom>
              Please provide additional information so that we may improve your future connections.
            </Typography>
            <Typography variant="caption">
              <Button variant="contained" size="small" onClick={sendFeedback}>
                Feedback
              </Button>
              <Duration startTime={Date.now() + FEEDBACK_DISMISS} />
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={0} className={classnames(css.layout, css.survey)}>
            How was your last connection?
            <span>
              <IconButton
                onClick={() => handleRating(100)}
                title="Good"
                placement="top"
                name="face-smile"
                color="success"
                size="lg"
              />
              <IconButton
                onClick={() => handleRating(50)}
                title="Okay"
                placement="top"
                name="face-confused"
                color="warning"
                size="lg"
              />
              <IconButton
                onClick={() => handleRating(0)}
                title="Bad"
                placement="top"
                name="face-frown-slight"
                color="danger"
                size="lg"
              />
            </span>
          </Paper>
        )}
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  survey: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minHeight: 60,
    '& span': { whiteSpace: 'nowrap' },
    '& .IconButtonTooltip + .IconButtonTooltip': {
      marginLeft: -spacing.xs,
    },
  },
  layout: {
    position: 'relative',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    '& > .MuiIconButton-root': {
      position: 'absolute',
      right: spacing.sm,
      top: spacing.sm,
    },
    '& .MuiButton-root': {
      marginRight: spacing.md,
    },
    '& > .MuiTypography-caption': {
      color: palette.grayLight.main,
    },
  },
}))
