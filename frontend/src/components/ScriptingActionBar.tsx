import { Stack,Typography,useMediaQuery } from '@mui/material'
import React from 'react'
import { useDispatch,useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { IconButton } from '../buttons/IconButton'
import { MOBILE_WIDTH } from '../constants'
import { Dispatch,State } from '../store'
import { radius } from '../styling'
import { Icon } from './Icon'

export const ScriptingActionBar: React.FC = () => {
  const selected = useSelector((state: State) => state.ui.selected)
  const scriptForm = useSelector((state: State) => state.ui.scriptForm)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  // Route-specific hiding is handled by ScriptingHeader.
  if (!selected.length || scriptForm) return null

  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      bgcolor="primary.main"
      borderRadius={radius.lg + 'px'}
      height="48px"
      marginX={2}
      marginY={1}
      pl={3}
      pr={1}
    >
      <Typography variant="subtitle2" color="alwaysWhite.main" fontWeight={800}>
        Choose a script
      </Typography>
      <Stack flexDirection="row" alignItems="center" gap={1}>
        <Typography variant="caption" color="alwaysWhite.main" height="1.5em">
          {selected.length}&nbsp;
          {mobile ? <Icon name="check" inline /> : `device${selected.length > 1 ? 's' : ''} selected`}
        </Typography>
        <IconButton
          icon="times"
          title="Clear selection"
          color="alwaysWhite"
          placement="bottom"
          onClick={() => {
            dispatch.ui.set({ selected: [] })
            history.push('/scripts')
          }}
        />
      </Stack>
    </Stack>
  )
}
