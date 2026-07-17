import React, { useState } from 'react'
import sleep from '../helpers/sleep'
import { setConnection } from '../helpers/connectionHelper'
import { Typography, Collapse, Paper, Button, Theme } from '@mui/material'
import { Dispatch, State } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { windowOpen } from '../services/browser'
import { IconButton } from '../buttons/IconButton'
import { Countdown } from './Countdown'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

const layoutSx = (theme: Theme) => ({
  padding: `${spacing.lg}px`,
  paddingLeft: `${spacing.xl}px`,
  position: 'relative' as const,
  '& > .MuiIconButton-root': {
    position: 'absolute',
    right: `${spacing.sm}px`,
    top: `${spacing.sm}px`,
  },
  '& .MuiButton-root': {
    marginRight: `${spacing.md}px`,
  },
  '& > .MuiTypography-caption': {
    color: theme.palette.grayLight.main,
  },
})

const surveySx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: 60,
  '& span': { whiteSpace: 'nowrap', marginTop: `${-spacing.md}px`, marginBottom: `${-spacing.md}px` },
  '& .IconButtonTooltip + .IconButtonTooltip': {
    marginLeft: `${-spacing.xs}px`,
  },
} as const

const highlightSx = (theme: Theme) => ({
  '@keyframes connectionSurveyHighlight': {
    '0%': { boxShadow: `0 0 0 4px ${theme.palette.primaryHighlight.main}` },
    '30%': { boxShadow: `0 0 0 4px ${theme.palette.primary.main}` },
    '80%': { boxShadow: `0 0 0 4px ${theme.palette.primaryHighlight.main}` },
  },
  animationName: 'connectionSurveyHighlight',
  animationIterationCount: '6',
  animationTimingFunction: 'ease-out',
  animationDuration: '0.7s',
})

const SUCCESS_DISMISS = 1000
const FEEDBACK_DISMISS = 15000
const formId = '1FAIpQLSeYtHBGJ8MQ-9I70_ggngkL4S3PcxoIluAds-f9i44CbjKBzg'

type Props = {
  connection?: IConnection
  highlight?: boolean
}

export const ConnectionSurvey: React.FC<Props> = ({ connection, highlight }) => {
  const user = useSelector((state: State) => state.user)
  const dispatch = useDispatch<Dispatch>()
  const [rated, setRated] = useState<number | null>(null)

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
          <Paper elevation={0} sx={[layoutSx, surveySx]}>
            <Typography variant="body2">Thank you for your feedback!</Typography>
          </Paper>
        ) : rated === 50 || rated === 0 ? (
          <Paper elevation={0} sx={layoutSx}>
            <IconButton size="sm" name="times" onClick={resetRating} />
            <Typography variant="subtitle2" gutterBottom>
              Let us know what happened.
            </Typography>
            <Typography variant="body2" gutterBottom>
              Please provide additional information so that we may improve your future connections.
            </Typography>
            <Typography variant="caption">
              <Button variant="contained" size="small" onClick={sendFeedback}>
                Give Feedback
              </Button>
              <Countdown endTime={Date.now() + FEEDBACK_DISMISS} />
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={0} sx={[layoutSx, surveySx, highlight ? highlightSx : {}]}>
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
