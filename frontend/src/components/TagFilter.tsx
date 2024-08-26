import React from 'react'
import structuredClone from '@ungap/structured-clone'
import { State, Dispatch } from '../store'
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
import { Tags } from './Tags'
import { Icon } from './Icon'

type Props = ListItemProps & {
  form: Partial<IOrganizationRole>
  name?: string
  disabled?: boolean
  systemRole?: boolean
  icon?: boolean
  selected?: boolean
  selectedIds?: string[]
  countsSx?: SxProps<Theme>
  onChange: (form: Partial<IOrganizationRole>) => void
}

export const TagFilter: React.FC<Props> = ({
  form,
  name = 'Access',
  disabled,
  systemRole,
  icon,
  selected,
  selectedIds,
  countsSx,
  onChange,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const tags = useSelector(selectTags)
  const filteredTags = tags.filter(t => form.tag?.values.includes(t.name))

  return (
    <>
      <ListItem {...props}>
        {icon && (
          <ListItemIcon>
            <Icon name={form.access === 'NONE' ? 'ban' : form.access === 'TAG' ? 'tag' : 'key'} size="md" fixedWidth />
          </ListItemIcon>
        )}
        <TextField
          select
          fullWidth
          disabled={disabled || systemRole}
          label={name}
          value={form.access}
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
          {selected && (
            <MenuItem value="SELECTED" disabled={!selectedIds?.length}>
              Selected
            </MenuItem>
          )}
        </TextField>
        <ListItemSecondaryAction sx={countsSx}>
          {form.access === 'SELECTED' && selectedIds?.length ? (
            <Chip size="small" label={`${selectedIds.length} device${selectedIds.length > 1 ? 's' : ''}`} />
          ) : form.access === 'NONE' ? (
            <Chip size="small" label="No devices" />
          ) : (
            <RoleAccessCounts role={form} />
          )}
        </ListItemSecondaryAction>
      </ListItem>
      {form.access === 'TAG' && (
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
