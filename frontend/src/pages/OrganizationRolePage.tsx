import React, { useEffect, useState } from 'react'
import isEqual from 'lodash.isequal'
import structuredClone from '@ungap/structured-clone'
import { makeStyles } from '@mui/styles'
import { useParams } from 'react-router-dom'
import { DEFAULT_ROLE, PERMISSION } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import { Button, Typography, List, ListItem, ListItemIcon, TextField } from '@mui/material'
import { Dispatch, State } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { PermissionsList } from '../components/PermissionsList'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { TagFilter } from '../components/TagFilter'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

const NAME_MAX_LENGTH = 64

export const OrganizationRolePage: React.FC = () => {
  const { roleID } = useParams<{ roleID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const disabled = useSelector((state: State) => state.organization.updating)
  const roles = useSelector((state: State) => selectOrganization(state).roles)
  const role = structuredClone(roles?.find(r => r.id === roleID) || DEFAULT_ROLE)
  const [form, setForm] = useState<IOrganizationRole>(role)
  const [saving, setSaving] = useState<boolean>(false)
  const systemRole = !!role.system
  const changed = !isEqual(form, role)

  const changeForm = async (changedForm: Partial<IOrganizationRole>) => setForm({ ...form, ...changedForm })
  const handlePermissionChange = (toggle, permission) => {
    if (toggle) {
      setForm({ ...form, permissions: form.permissions.filter(fp => fp !== permission) })
    } else {
      setForm({ ...form, permissions: [...form.permissions, permission] })
    }
  }

  useEffect(() => {
    changeForm(role)
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
          <ListItemIcon>
            <Icon name="user-shield" size="md" fixedWidth />
          </ListItemIcon>
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
        <TagFilter icon form={form} onChange={changeForm} disabled={disabled} systemRole={systemRole} selectAll />
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
              changeForm(form)
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
