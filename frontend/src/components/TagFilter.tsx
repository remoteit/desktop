import React from 'react'
import structuredClone from '@ungap/structured-clone'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { DEFAULT_ROLE } from '../models/organization'
import {
  SxProps,
  Theme,
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
import { RoleAccessCounts } from './RoleAccessCounts'
import { selectTags } from '../selectors/tags'
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
  countsSx?: SxProps<Theme>
  onChange: (form: Partial<IFileForm>) => void
}

export const TagFilter: React.FC<Props> = ({
  form,
  name = 'Access',
  disabled,
  systemRole,
  icon,
  selectedIds,
  countsSx,
  onChange,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const tags = useSelector(selectTags)
  const filteredTags = tags.filter(t => form.tag?.values.includes(t.name))

  // Handle empty states
  let formAccess = form.access
  if (formAccess === 'CUSTOM' && !form.deviceIds?.length) formAccess = 'ALL'
  if (formAccess === 'SELECTED' && !selectedIds?.length) formAccess = 'ALL'

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
          label={name}
          value={formAccess}
          variant="filled"
          onChange={event => {
            let tag: ITagFilter | undefined
            const access = event.target.value as IRoleAccess
            if (access === 'TAG') tag = structuredClone(DEFAULT_ROLE.tag)
            onChange({ ...form, access, tag })
          }}
        >
          <MenuItem value="NONE">None</MenuItem>
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="TAG">Tagged</MenuItem>
          {form.deviceIds?.length && <MenuItem value="CUSTOM">Saved Devices</MenuItem>}
          {selectedIds?.length && <MenuItem value="SELECTED">Selected Devices</MenuItem>}
        </TextField>
        <ListItemSecondaryAction sx={countsSx}>
          {formAccess === 'CUSTOM' && form.deviceIds?.length ? (
            <Chip size="small" label={`${form.deviceIds.length} device${form.deviceIds.length > 1 ? 's' : ''}`} />
          ) : formAccess === 'SELECTED' && selectedIds?.length ? (
            <ColorChip size="small" color="primary" variant="contained" label={`${selectedIds.length} selected`} />
          ) : formAccess === 'NONE' ? (
            <Chip size="small" label="No devices" />
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
              onCreate={async tag => await dispatch.tags.create({ tag })}
              onSelect={tag => {
                form.tag && form.tag.values.push(tag.name)
                onChange(form)
              }}
              tags={tags}
              filter={filteredTags}
            />
          </Box>
          <Stack flexDirection="row" alignItems="center" sx={{ whiteSpace: 'nowrap', marginLeft: 1 }}>
            <Typography variant="caption">Match: &nbsp;</Typography>
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
                Any
              </MenuItem>
              <MenuItem dense value="ALL">
                All
              </MenuItem>
            </TextField>
          </Stack>
        </ListItem>
      )}
    </>
  )
}
