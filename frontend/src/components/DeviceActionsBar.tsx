import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Divider, Typography, InputLabel, Collapse } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectLimitsLookup } from '../selectors/organizations'
import { getActiveAccountId } from '../selectors/accounts'
import { getSelectedTags } from '../helpers/selectedHelper'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { IconButton } from '../buttons/IconButton'
import { useHistory } from 'react-router-dom'
import { selectTags } from '../selectors/tags'
import { Container } from './Container'
import { TagEditor } from './TagEditor'
import { Notice } from './Notice'
import { Title } from './Title'
import { spacing, radius } from '../styling'

type Props = { select?: boolean; selected: IDevice['id'][]; devices?: IDevice[]; children?: React.ReactNode }

export const DeviceActionsBar: React.FC<Props> = ({ select, selected = [], devices, children }) => {
  const { accountId, feature, tags, adding, removing, destroying } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    feature: selectLimitsLookup(state),
    tags: selectTags(state),
    adding: state.tags.adding,
    removing: state.tags.removing,
    destroying: state.ui.destroying,
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
        <Collapse in={!!(select || selected.length)} mountOnEnter>
          <Box className={css.actions}>
            <Title>
              <Typography variant="subtitle1">{selected.length} Selected</Typography>
            </Title>
            {feature.tagging && (
              <>
                <InputLabel shrink>tags</InputLabel>
                <TagEditor
                  button="plus"
                  tags={tags}
                  buttonProps={{
                    title: 'Add Tag',
                    color: 'alwaysWhite',
                    placement: 'bottom',
                    loading: adding,
                    disabled: adding || !selected.length,
                  }}
                  keyboardShortcut={false}
                  onCreate={onCreate}
                  onSelect={tag => dispatch.tags.addSelected({ tag, selected })}
                />
                <TagEditor
                  button="minus"
                  placeholder="Remove a tag..."
                  allowAdding={false}
                  tags={getSelectedTags(devices, selected)}
                  buttonProps={{
                    title: 'Remove Tag',
                    color: 'alwaysWhite',
                    placement: 'bottom',
                    loading: removing,
                    disabled: removing || !selected.length,
                  }}
                  keyboardShortcut={false}
                  onCreate={onCreate}
                  onSelect={tag => dispatch.tags.removeSelected({ tag, selected })}
                />
                <Divider orientation="vertical" color="white" />
              </>
            )}
            <ConfirmButton
              icon="trash"
              title="Delete selected"
              color="alwaysWhite"
              placement="bottom"
              disabled={!selected.length}
              loading={destroying}
              onClick={async () => await dispatch.devices.destroySelected(selected)}
              confirmProps={{
                title: 'Confirm Device Deletion',
                color: 'error',
                action: `Delete ${selected.length} device${selected.length === 1 ? '' : 's'}`,
                children: (
                  <>
                    <Notice severity="error" gutterBottom fullWidth>
                      Deletion is irreversible and may require device access for recovery.
                    </Notice>
                    <Typography variant="body2">
                      Uninstall the Remote.It agent before deletion for best results.
                    </Typography>
                  </>
                ),
              }}
              confirm
            />
            <Divider orientation="vertical" color="white" />
            <IconButton
              icon="times"
              title="Clear selection"
              color="alwaysWhite"
              placement="bottom"
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
      transform: 'translate(0, 3px) scale(0.75)',
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
