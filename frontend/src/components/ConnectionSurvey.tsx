import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Typography, Collapse, Paper } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ConnectionSurvey: React.FC<Props> = ({ connection, service }) => {
  const [rated, setRated] = useState<boolean>(false)
  const css = useStyles()

  if (!connection) return null

  const show = !!connection.endTime && Date.now() - connection.endTime < 1000 * 60 * 60 * 24 // one day

  const handleRating = (rating: number) => {
    // call api to rate connection
    setRated(true)
  }

  return (
    <Collapse in={show}>
      <Gutters top={null}>
        <Paper elevation={0} className={css.layout}>
          {rated ? (
            <>words</>
          ) : (
            <>
              How was your last connection?
              <span>
                <IconButton
                  onClick={() => handleRating(2)}
                  title="Good"
                  placement="top"
                  name="face-smile"
                  color="success"
                  size="lg"
                />
                <IconButton
                  onClick={() => handleRating(1)}
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
            </>
          )}
        </Paper>
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  layout: {
    display: 'flex',
    fontWeight: 500,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: spacing.sm,
    paddingLeft: spacing.lg,
    '& .IconButtonTooltip + .IconButtonTooltip': {
      marginLeft: -spacing.sm,
    },
  },
}))
