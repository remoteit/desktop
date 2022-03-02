import React from 'react'
import { makeStyles, Box, Typography, Collapse } from '@material-ui/core'
import { SelectedTagEditor } from './SelectedTagEditor'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Title } from './Title'
import { Dispatch } from '../store'
import { Container } from './Container'
import { IconButton } from '../buttons/IconButton'
import { spacing, radius } from '../styling'

type Props = { select?: boolean; selected: string[] }

export const DeviceActionsBar: React.FC<Props> = ({ select, selected = [], children }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  return (
    <Container
      integrated
      gutterBottom
      header={
        <Collapse in={!!(select || selected.length)} timeout={400}>
          <Box className={css.actions}>
            <Title>
              <Typography variant="subtitle1">{selected.length} Selected</Typography>
            </Title>
            <SelectedTagEditor selected={selected} button="tag" />
            <IconButton
              icon="times"
              title="Clear selection"
              color="alwaysWhite"
              onClick={() => {
                dispatch.ui.set({ selected: [] })
                history.push('/devices')
              }}
            />
          </Box>
        </Collapse>
      }
    >
      {children}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: `1px solid ${palette.white.main}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: palette.primary.main,
    borderRadius: radius,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    paddingRight: spacing.sm,
    '& .MuiTypography-root': {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      fontWeight: 800,
      color: palette.alwaysWhite.main,
    },
  },
}))
