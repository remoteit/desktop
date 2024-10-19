import React from 'react'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Box, Divider, Typography, InputLabel, Collapse } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectLimitsLookup, selectPermissions } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { getSelectedTags } from '../helpers/selectedHelper'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { IconButton } from '../buttons/IconButton'
import { useHistory } from 'react-router-dom'
import { selectTags } from '../selectors/tags'
import { TagEditor } from './TagEditor'
import { Notice } from './Notice'
import { TestUI } from './TestUI'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing, radius } from '../styling'

type Props = { devices?: IDevice[] }

export const DevicesActionBar: React.FC<Props> = ({ devices }) => {
  const accountId = useSelector(selectActiveAccountId)
  const feature = useSelector(selectLimitsLookup)
  const tags = useSelector(selectTags)
  const selected = useSelector((state: State) => state.ui.selected)
  const adding = useSelector((state: State) => state.tags.adding)
  const removing = useSelector((state: State) => state.tags.removing)
  const destroying = useSelector((state: State) => state.ui.destroying)
  const permissions = useSelector(selectPermissions)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  const onCreate = async tag => await dispatch.tags.create({ tag, accountId })

  return (
    <Box className={css.actions}>
      <Title>
        <Typography variant="subtitle1">
          {selected.length}&nbsp;
          {mobile ? <Icon name="check" inline /> : 'Selected'}
        </Typography>
      </Title>
      {feature.tagging && (
        <>
          {mobile || <InputLabel shrink>tags</InputLabel>}
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
      {permissions.includes('SCRIPTING') && !mobile && (
        <>
          <InputLabel shrink sx={{ ml: 2 }}>
            script
          </InputLabel>
          <IconButton
            icon="chevron-right"
            title="Choose Script"
            color="alwaysWhite"
            placement="bottom"
            disabled={!selected.length}
            to="/scripting/scripts"
          />
          <IconButton
            icon="plus"
            title="New Script"
            color="alwaysWhite"
            placement="bottom"
            disabled={!selected.length}
            to="/scripting/add"
          />
          <Divider orientation="vertical" color="white" />
        </>
      )}
      <ConfirmIconButton
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
              <Typography variant="body2">Uninstall the Remote.It agent before deletion for best results.</Typography>
            </>
          ),
        }}
        confirm
      />
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
    borderRadius: radius.lg,
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
