import React from 'react'
import structuredClone from '@ungap/structured-clone'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { DEFAULT_ROLE } from '../models/organization'
import {
  Box,
  Chip,
  Stack,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemSecondaryAction,
  MenuItem,
  TextField,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { RoleAccessCounts } from './RoleAccessCounts'
import { selectTags } from '../selectors/tags'
import { canEditTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { ColorChip } from './ColorChip'
import { Tags } from './Tags'
import { Icon } from './Icon'
// import { Pre } from './Pre'

type Props = ListItemProps & {
  form: Partial<IFileForm>
  name?: string
  disabled?: boolean
  systemRole?: boolean
  icon?: boolean
  selectedIds?: string[]
  selectAll?: boolean
  selectDevices?: boolean
  onSelectIds?: () => void
  onChange: (form: Partial<IFileForm>) => void
}

export const TagFilter: React.FC<Props> = ({
  form,
  name,
  disabled,
  systemRole,
  icon,
  selectedIds,
  onChange,
  selectAll,
  selectDevices,
  onSelectIds,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { t } = useTranslation()
  const tags = useSelector(selectTags)
  const canEdit = useSelector(canEditTags)
  const filteredTags = tags.filter(tag => form.tag?.values.includes(tag.name))
  const displayName = name ?? t('tagFilter.accessLabel', 'Access')

  // Handle empty states
  let formAccess = form.access
  if (formAccess === 'CUSTOM' && !form.deviceIds?.length) formAccess = 'NONE'
  if (formAccess === 'ALL' && !selectAll) formAccess = 'NONE'

  return (
    <>
      <ListItem {...props}>
        {icon && (
          <ListItemIcon>
            <Icon name={formAccess === 'NONE' ? 'ban' : formAccess === 'TAG' ? 'tag' : 'key'} size="md" fixedWidth />
          </ListItemIcon>
        )}
        <TextField
          select
          fullWidth
          disabled={disabled || systemRole}
          label={displayName}
          value={formAccess}
          variant="filled"
          onChange={event => {
            let tag: ITagFilter | undefined
            const access = event.target.value as IRoleAccess
            if (access === 'TAG') tag = structuredClone(DEFAULT_ROLE.tag)
            onChange({ ...form, access, tag })
            if (access === 'SELECTED') onSelectIds?.()
          }}
        >
          <MenuItem value="NONE">{t('tagFilter.none', 'None')}</MenuItem>
          {selectAll && <MenuItem value="ALL">{t('tagFilter.all', 'All')}</MenuItem>}
          <MenuItem value="TAG">{t('tagFilter.tagged', 'Tagged')}</MenuItem>
          {selectDevices && (
            <MenuItem value="SELECTED">
              {selectedIds?.length
                ? t('tagFilter.selectedDevices', 'Selected Devices')
                : t('tagFilter.selectDevices', 'Select Devices')}
            </MenuItem>
          )}
          {form.deviceIds?.length && <MenuItem value="CUSTOM">{t('tagFilter.savedDevices', 'Saved Devices')}</MenuItem>}
        </TextField>
        <ListItemSecondaryAction sx={{ marginRight: selectDevices ? 2 : 0 }}>
          {formAccess === 'CUSTOM' && form.deviceIds?.length ? (
            <Chip
              size="small"
              label={t('tagFilter.deviceCount', {
                count: form.deviceIds.length,
                defaultValue_one: '{{count}} device',
                defaultValue_other: '{{count}} devices',
              })}
            />
          ) : formAccess === 'SELECTED' && selectedIds?.length ? (
            <ColorChip
              size="small"
              color="primary"
              variant="contained"
              label={t('tagFilter.selectedCount', { count: selectedIds.length, defaultValue: '{{count}} selected' })}
              onClick={() => onSelectIds?.()}
            />
          ) : formAccess === 'SELECTED' ? (
            <ColorChip
              size="small"
              color="primary"
              variant="contained"
              label={t('tagFilter.selectDevices', 'Select Devices')}
              onClick={() => onSelectIds?.()}
            />
          ) : formAccess === 'NONE' ? (
            <Chip size="small" label={t('tagFilter.noDevices', 'No devices')} />
          ) : (
            <RoleAccessCounts role={form} />
          )}
        </ListItemSecondaryAction>
      </ListItem>
      {formAccess === 'TAG' && (
        <ListItem {...props}>
          {icon && <ListItemIcon />}
          <Stack flexDirection="row" flexWrap="wrap">
            <Tags
              tags={filteredTags}
              onDelete={({ name }) => {
                let tag = structuredClone(form.tag || DEFAULT_ROLE.tag) as ITagFilter
                if (!tag.values) return
                const index = tag.values.indexOf(name)
                tag.values.splice(index, 1)
                form.tag = tag
                onChange(form)
              }}
              onClick={tag => {
                dispatch.devices.set({ tag: { values: [tag.name], operator: tag.operator } })
                dispatch.devices.fetchList()
                history.push('/devices')
              }}
            />
          </Stack>
          <Box flexGrow={1}>
            <TagEditor
              allowAdding={canEdit}
              onCreate={async tag => await dispatch.tags.create({ tag })}
              onSelect={tag => {
                const formTag = structuredClone(form.tag || DEFAULT_ROLE.tag)
                formTag.values.push(tag.name)
                onChange({ ...form, tag: formTag })
              }}
              tags={tags}
              filter={filteredTags}
            />
          </Box>
          <Stack flexDirection="row" alignItems="center" sx={{ whiteSpace: 'nowrap', marginLeft: 1 }}>
            <Typography variant="caption">{t('tagFilter.matchLabel', 'Match:')} &nbsp;</Typography>
            <TextField
              select
              hiddenLabel
              size="small"
              disabled={disabled}
              value={form.tag?.operator || DEFAULT_ROLE.tag?.operator || 'ALL'}
              variant="filled"
              onChange={event => {
                form.tag && (form.tag.operator = event.target.value as ITagOperator)
                onChange(form)
              }}
            >
              <MenuItem dense value="ANY">
                {t('tagFilter.any', 'Any')}
              </MenuItem>
              <MenuItem dense value="ALL">
                {t('tagFilter.all', 'All')}
              </MenuItem>
            </TextField>
          </Stack>
        </ListItem>
      )}
    </>
  )
}
