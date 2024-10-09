import React from 'react'
import { State } from '../store'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Stack, Typography, Button } from '@mui/material'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { radius } from '../styling'
import { Icon } from './Icon'

export const DevicesSelectBar: React.FC = () => {
  const selected = useSelector((state: State) => state.ui.selected)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const history = useHistory()

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="primary.main"
      borderRadius={radius.lg + 'px'}
      height="48px"
      marginX={2}
      marginY={1}
      pl={3}
      pr={1}
    >
      {selected.length ? (
        <Typography variant="subtitle2" color="alwaysWhite.main" fontWeight={800}>
          {selected.length}&nbsp;
          {mobile ? <Icon name="check" inline /> : 'Selected'}
        </Typography>
      ) : (
        <Typography variant="body2" color="alwaysWhite.main">
          Select devices
        </Typography>
      )}
      <Stack flexDirection="row" alignItems="center" gap={1}>
        <Button variant="contained" size="small" onClick={() => history.push('/devices')} sx={{ opacity: 0.7 }}>
          Cancel
        </Button>
        {!!selected.length && (
          <Button variant="contained" size="small" onClick={history.goBack}>
            Continue
          </Button>
        )}
      </Stack>
    </Stack>
  )
}
