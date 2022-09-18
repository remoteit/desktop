import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { makeStyles } from '@mui/styles'
import { getActiveAccountId } from '../models/accounts'
import { useParams, useHistory } from 'react-router-dom'
import { DEFAULT_ROLE, PERMISSION, getOrganization } from '../models/organization'
import { Button, Typography, List, ListItem, ListItemSecondaryAction, MenuItem, TextField } from '@mui/material'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { RoleAccessCounts } from '../components/RoleAccessCounts'
import { PermissionsList } from '../components/PermissionsList'
import { DeleteButton } from '../buttons/DeleteButton'
import { selectTags } from '../models/tags'
import { Container } from '../components/Container'
import { TagEditor } from '../components/TagEditor'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Tags } from '../components/Tags'

const NAME_MAX_LENGTH = 64

export const OrganizationRolePage: React.FC = () => {
  const { roleID } = useParams<{ roleID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  const { accountId, disabled, roles, tags } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    disabled: state.organization.updating,
    roles: getOrganization(state).roles,
    tags: selectTags(state, getActiveAccountId(state)),
  }))
  const role = roles?.find(r => r.id === roleID) || DEFAULT_ROLE
  const [form, setForm] = useState<IOrganizationRole>(cloneDeep(role))
  const [saving, setSaving] = useState<boolean>(false)
  const systemRole = !!role.system
  const filteredTags = tags.filter(t => form.tag?.values.includes(t.name))
  const changed = !isEqual(form, role)

  const changeForm = async (changedForm: IOrganizationRole) => setForm(changedForm)
  const handlePermissionChange = (toggle, permission) => {
    if (toggle) {
      setForm({ ...form, permissions: form.permissions.filter(fp => fp !== permission) })
    } else {
      setForm({ ...form, permissions: [...form.permissions, permission] })
    }
  }

  useEffect(() => {
    changeForm(cloneDeep(role))
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
                  <Notice severity="danger" fullWidth gutterBottom>
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
        <Typography variant="subtitle1">Role</Typography>
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
        <ListItem>
          <TextField
            select
            fullWidth
            disabled={disabled || systemRole}
            label="Access"
            value={role.id === 'NONE' ? '-' : Boolean(form?.tag).toString()}
            variant="filled"
            onChange={event => {
              const tag = event.target.value === 'true' ? DEFAULT_ROLE.tag : undefined
              changeForm({ ...form, tag })
            }}
          >
            <MenuItem value="-" disabled>
              None
            </MenuItem>
            <MenuItem value="false">All</MenuItem>
            <MenuItem value="true">Tagged</MenuItem>
          </TextField>
          <ListItemSecondaryAction>
            <RoleAccessCounts role={form} />
          </ListItemSecondaryAction>
        </ListItem>
        {form.tag && (
          <ListItem>
            {/* <InputLabel shrink>Device Filter</InputLabel> */}
            <Tags
              tags={filteredTags}
              onDelete={({ name }) => {
                let tag = { ...(form.tag || DEFAULT_ROLE.tag) } as ITagFilter
                if (!tag.values) return
                const index = tag.values.indexOf(name)
                tag.values.splice(index, 1)
                form.tag = tag
                changeForm(form)
              }}
              onClick={tag => {
                dispatch.devices.set({ tag: { values: [tag.name] } })
                dispatch.devices.fetch()
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
                value={form.tag.operator}
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
      </List>
      <PermissionsList
        title="Device Permissions"
        locked={systemRole}
        disabled={disabled}
        allowed={form.permissions}
        permissions={Object.keys(PERMISSION).filter(p => !PERMISSION[p].user)}
        onChange={handlePermissionChange}
      />
      <PermissionsList
        title="User Permissions"
        locked={systemRole}
        disabled={disabled}
        allowed={form.permissions}
        permissions={Object.keys(PERMISSION).filter(p => PERMISSION[p].user)}
        onChange={handlePermissionChange}
      />
      {!systemRole && (
        <Gutters top="lg">
          <Button
            variant="contained"
            color="primary"
            disabled={disabled || !changed || saving}
            onClick={async () => {
              setSaving(true)
              if (form.tag && form.tag.values.length === 0) form.tag = undefined
              await dispatch.organization.setRole(form)
              setSaving(false)
              setForm(cloneDeep(form))
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
  button: { fontWeight: 'bold', letterSpacing: 1, color: palette.grayDarker.main },
}))
