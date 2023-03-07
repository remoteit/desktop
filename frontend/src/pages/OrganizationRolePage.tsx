import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual'
import structuredClone from '@ungap/structured-clone'
import { makeStyles } from '@mui/styles'
import { getActiveAccountId } from '../selectors/accounts'
import { useParams, useHistory } from 'react-router-dom'
import { DEFAULT_ROLE, PERMISSION } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  MenuItem,
  TextField,
} from '@mui/material'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { RoleAccessCounts } from '../components/RoleAccessCounts'
import { PermissionsList } from '../components/PermissionsList'
import { DeleteButton } from '../buttons/DeleteButton'
import { selectTags } from '../selectors/tags'
import { Container } from '../components/Container'
import { TagEditor } from '../components/TagEditor'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Tags } from '../components/Tags'
import { Icon } from '../components/Icon'

const NAME_MAX_LENGTH = 64

export const OrganizationRolePage: React.FC = () => {
  const { roleID } = useParams<{ roleID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  const { accountId, disabled, roles, tags } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    disabled: state.organization.updating,
    roles: selectOrganization(state).roles,
    tags: selectTags(state, getActiveAccountId(state)),
  }))
  const role = roles?.find(r => r.id === roleID) || structuredClone(DEFAULT_ROLE)
  const [form, setForm] = useState<IOrganizationRole>(structuredClone(role))
  const [saving, setSaving] = useState<boolean>(false)
  const systemRole = !!role.system
  const filteredTags = tags.filter(t => form.tag?.values.includes(t.name))
  const changed = !isEqual(form, role)

  const changeForm = async (changedForm: IOrganizationRole) => setForm({ ...changedForm })
  const handlePermissionChange = (toggle, permission) => {
    if (toggle) {
      setForm({ ...form, permissions: form.permissions.filter(fp => fp !== permission) })
    } else {
      setForm({ ...form, permissions: [...form.permissions, permission] })
    }
  }

  useEffect(() => {
    changeForm(structuredClone(role))
  }, [roleID])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{role.name || 'New Role'}</Title>
          {!systemRole && role.id && (
            <DeleteButton
              warning={
                <>
                  <Notice severity="error" fullWidth gutterBottom>
                    You will be permanently deleting the role <i>{role.name}.</i>
                  </Notice>
                  Any members with this role will lose access until they have been set to another role.
                </>
              }
              onDelete={async () => await dispatch.organization.removeRole(form)}
            />
          )}
        </Typography>
      }
    >
      <List className={css.form}>
        {systemRole && (
          <Notice severity="info" gutterBottom>
            System roles cannot be modified.
          </Notice>
        )}
        <ListItem>
          <TextField
            required
            fullWidth
            autoFocus
            label="Name"
            value={form.name}
            disabled={disabled || systemRole}
            variant="filled"
            onChange={event => {
              const name = event.target.value.substring(0, NAME_MAX_LENGTH)
              setForm({ ...form, name })
            }}
          />
        </ListItem>
        <Typography variant="subtitle1" gutterBottom>
          User Permissions
        </Typography>
        <PermissionsList
          locked={systemRole}
          disabled={disabled}
          allowed={form.permissions}
          permissions={Object.keys(PERMISSION).filter(p => PERMISSION[p].user)}
          onChange={handlePermissionChange}
        />
        <Typography variant="subtitle1" gutterBottom>
          Device and Network Permissions
        </Typography>
        <ListItem>
          <ListItemIcon>
            <Icon name={form.access === 'NONE' ? 'ban' : form.access === 'TAG' ? 'tag' : 'key'} size="md" fixedWidth />
          </ListItemIcon>
          <TextField
            select
            fullWidth
            disabled={disabled || systemRole}
            label="Access"
            value={form.access}
            variant="filled"
            onChange={event => {
              let tag: ITagFilter | undefined
              const access = event.target.value as IRoleAccess
              if (access === 'TAG') tag = structuredClone(DEFAULT_ROLE.tag)
              changeForm({ ...form, access, tag })
            }}
          >
            <MenuItem value="NONE">None</MenuItem>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="TAG">Tagged</MenuItem>
          </TextField>
          <ListItemSecondaryAction>
            <RoleAccessCounts role={form} />
          </ListItemSecondaryAction>
        </ListItem>
        {form.access === 'TAG' && (
          <ListItem>
            <ListItemIcon />
            <Tags
              tags={filteredTags}
              onDelete={({ name }) => {
                let tag = structuredClone(form.tag || DEFAULT_ROLE.tag) as ITagFilter
                if (!tag.values) return
                const index = tag.values.indexOf(name)
                tag.values.splice(index, 1)
                form.tag = tag
                changeForm(form)
              }}
              onClick={tag => {
                dispatch.devices.set({ tag: { values: [tag.name] } })
                dispatch.devices.fetchList()
                history.push('/devices')
              }}
            />
            <TagEditor
              onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
              onSelect={tag => {
                form.tag && form.tag.values.push(tag.name)
                changeForm(form)
              }}
              tags={tags}
              filter={filteredTags}
            />
            &nbsp;
            <ListItemSecondaryAction>
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
                  changeForm(form)
                }}
              >
                <MenuItem dense value="ANY">
                  Any
                </MenuItem>
                <MenuItem dense value="ALL">
                  All
                </MenuItem>
              </TextField>
            </ListItemSecondaryAction>
          </ListItem>
        )}
        {form.access !== 'NONE' && (
          <PermissionsList
            locked={systemRole}
            disabled={disabled}
            allowed={form.permissions}
            permissions={Object.keys(PERMISSION).filter(p => !PERMISSION[p].user && !PERMISSION[p].hidden)}
            onChange={handlePermissionChange}
          />
        )}
      </List>
      {!systemRole && (
        <Gutters top="lg">
          <Button
            variant="contained"
            color="primary"
            disabled={disabled || !changed || saving}
            onClick={async () => {
              setSaving(true)
              if (form.tag && form.tag.values.length === 0) form.tag = undefined
              if (!form.tag && form.access === 'TAG') form.access = 'NONE'
              await dispatch.organization.setRole(form)
              setSaving(false)
              setForm(structuredClone(form))
            }}
          >
            {saving ? 'Saving...' : changed ? 'Save' : 'Saved'}
          </Button>
        </Gutters>
      )}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  form: {
    '& .MuiTextField-root': { maxWidth: 400 },
    '& .MuiListItem-secondaryAction': { paddingRight: 130 },
  },
  button: { fontWeight: 500, letterSpacing: 1, color: palette.grayDarker.main },
}))
