import React from 'react'
import { makeStyles, Box, Typography, Collapse } from '@material-ui/core'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { spacing, radius } from '../styling'
import { Container } from './Container'
import { IconButton } from '../buttons/IconButton'
import { TagEditor } from './TagEditor'
import { Title } from './Title'

type Props = {
  selected: string[]
}

export const DeviceActionsBar: React.FC<Props> = ({ selected = [], children }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  return (
    <Container
      integrated
      gutterBottom
      header={
        <Collapse in={!!selected.length} timeout={600}>
          <Box className={css.actions}>
            <Typography variant="subtitle1">{selected.length} Selected</Typography>
            {/* <TagEditor selected={selected} button="tag" /> */}
            <IconButton
              icon="times"
              title="Clear selection"
              color="alwaysWhite"
              onClick={() => dispatch.ui.set({ selected: [] })}
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
