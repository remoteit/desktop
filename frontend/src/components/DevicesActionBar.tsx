import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { Box, Divider, Typography, InputLabel } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectLimitsLookup, selectPermissions } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { getSelectedTags } from '../helpers/selectedHelper'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { canEditTags } from '../models/tags'
import { IconButton } from '../buttons/IconButton'
import { useHistory } from 'react-router-dom'
import { selectTags } from '../selectors/tags'
import { DevicesActionMenu } from './DevicesActionMenu'
import { TagEditor } from './TagEditor'
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
  const permissions = useSelector(selectPermissions)
  const canEdit = useSelector((state: State) => canEditTags(state, accountId))
  const { containerRef, containerWidth } = useContainerWidth()
  const mobile = containerWidth < MOBILE_WIDTH
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { t } = useTranslation()

  const onCreate = async tag => await dispatch.tags.create({ tag, accountId })

  return (
    <Box
      ref={containerRef}
      sx={theme => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `1px solid ${theme.palette.white.main}`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme.palette.primary.main,
        borderRadius: `${radius.lg}px`,
        marginLeft: `${spacing.sm}px`,
        marginRight: `${spacing.sm}px`,
        marginBottom: `${spacing.xs}px`,
        paddingLeft: `${spacing.sm}px`,
        paddingRight: `${spacing.sm}px`,
        zIndex: 10,
        '& .MuiTypography-subtitle1': {
          marginTop: `${spacing.xs}px`,
          marginBottom: `${spacing.xs}px`,
          paddingLeft: `${spacing.sm}px`,
          fontWeight: 800,
          color: theme.palette.alwaysWhite.main,
        },
        '& .MuiInputLabel-root': {
          color: theme.palette.alwaysWhite.main,
          marginRight: `${spacing.xs}px`,
          transform: 'translate(0, 3px) scale(0.75)',
        },
        '& > div + div': {
          marginLeft: `${-spacing.xs}px`,
        },
        '& .MuiDivider-root': {
          height: '1.5em',
          backgroundColor: theme.palette.alwaysWhite.main,
          marginLeft: `${spacing.sm}px`,
          marginRight: `${spacing.sm}px`,
          opacity: 0.3,
        },
      })}
    >
      <IconButton
        icon="times"
        title={t('deviceList.clearSelection', 'Clear selection')}
        color="alwaysWhite"
        placement="bottom"
        onClick={() => {
          dispatch.ui.set({ selected: [], selectionAnchor: undefined })
          history.push('/devices')
        }}
      />
      <Title sx={{ flexGrow: 0 }}>
        <Typography variant="subtitle1">
          {selected.length}&nbsp;
          {mobile ? <Icon name="check" inline /> : t('deviceList.selected', 'Selected')}
        </Typography>
      </Title>
      <Box sx={{ flexGrow: 1 }} />
      {feature.tagging && canEdit && (
        <>
          {!mobile && <InputLabel shrink>{t('deviceList.tagsLabel', 'tags')}</InputLabel>}
          <TagEditor
            button="plus"
            tags={tags}
            buttonProps={{
              title: t('deviceList.addTag', 'Add Tag'),
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
            placeholder={t('deviceList.removeTagPlaceholder', 'Remove a tag...')}
            allowAdding={false}
            tags={getSelectedTags(devices, selected)}
            buttonProps={{
              title: t('deviceList.removeTag', 'Remove Tag'),
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
            {t('deviceList.scriptLabel', 'script')}
          </InputLabel>
          <IconButton
            icon="chevron-right"
            title={t('deviceList.chooseScript', 'Choose Script')}
            color="alwaysWhite"
            placement="bottom"
            disabled={!selected.length}
            to="/scripts"
          />
          <IconButton
            icon="plus"
            title={t('deviceList.newScript', 'New Script')}
            color="alwaysWhite"
            placement="bottom"
            disabled={!selected.length}
            to="/scripts/add"
          />
          <Divider orientation="vertical" color="white" />
        </>
      )}
      <DevicesActionMenu />
    </Box>
  )
}
