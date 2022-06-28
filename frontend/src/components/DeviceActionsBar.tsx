import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Divider, Typography, InputLabel, Collapse } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getActiveAccountId } from '../models/accounts'
import { getSelectedTags } from '../helpers/selectedHelper'
import { useHistory } from 'react-router-dom'
import { selectTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { Title } from './Title'
import { Container } from './Container'
import { IconButton } from '../buttons/IconButton'
import { spacing, radius } from '../styling'

type Props = { select?: boolean; selected: IDevice['id'][]; devices?: IDevice[]; children?: React.ReactNode }

export const DeviceActionsBar: React.FC<Props> = ({ select, selected = [], devices, children }) => {
  const { accountId, tags, adding, removing } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    tags: selectTags(state),
    adding: state.tags.adding,
    removing: state.tags.removing,
  }))
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  const onCreate = async tag => await dispatch.tags.create({ tag, accountId })

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Collapse in={!!(select || selected.length)} timeout={400}>
          <Box className={css.actions}>
            <Title>
              <Typography variant="subtitle1">{selected.length} Selected</Typography>
            </Title>
            <InputLabel shrink>tags</InputLabel>
            <TagEditor
              button="plus"
              tags={tags}
              buttonProps={{ title: 'Add Tag', color: 'alwaysWhite', loading: adding, disabled: adding }}
              onCreate={onCreate}
              onSelect={tag => dispatch.tags.addSelected({ tag, selected })}
            />
            <TagEditor
              allowAdding={false}
              tags={getSelectedTags(devices, selected)}
              button="minus"
              buttonProps={{ title: 'Remove Tag', color: 'alwaysWhite', loading: removing, disabled: removing }}
              onCreate={onCreate}
              onSelect={tag => dispatch.tags.removeSelected({ tag, selected })}
            />
            <Divider orientation="vertical" color="white" />
            <IconButton
              icon="times"
              title="Clear selection"
              color="alwaysWhite"
              onClick={() => {
                dispatch.ui.set({ selected: [] })
                history.push('/devices')
              }}
              size="lg"
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
    marginBottom: spacing.xs,
    paddingRight: spacing.sm,
    zIndex: 10,
    '& .MuiTypography-subtitle1': {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      fontWeight: 800,
      color: palette.alwaysWhite.main,
    },
    '& .MuiInputLabel-root': {
      color: palette.alwaysWhite.main,
      marginRight: spacing.xs,
    },
    '& > div + div': {
      marginLeft: -spacing.xs,
    },
    '& .MuiDivider-root': {
      height: '1.5em',
      backgroundColor: palette.alwaysWhite.main,
      marginLeft: spacing.sm,
      marginRight: spacing.sm,
      opacity: 0.3,
    },
  },
}))
