import React, { useEffect, useState } from 'react'
import { DEFAULT_ROLE, PERMISSION } from '../models/organization'
import { useParams, useHistory } from 'react-router-dom'
import {
  makeStyles,
  Button,
  Typography,
  List,
  ListItem,
  ListItemSecondaryAction,
  MenuItem,
  TextField,
  Chip,
} from '@material-ui/core'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { getActiveAccountId } from '../models/accounts'
import { ListItemSetting } from '../components/ListItemSetting'
import { findTagIndex } from '../helpers/utilHelper'
import { selectTags } from '../models/tags'
import { Container } from '../components/Container'
import { TagEditor } from '../components/TagEditor'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Tags } from '../components/Tags'
import analyticsHelper from '../helpers/analyticsHelper'

const NAME_MAX_LENGTH = 64

export const OrganizationRolePage: React.FC = () => {
  const { roleID } = useParams<{ roleID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  const { disabled, role, tags } = useSelector((state: ApplicationState) => {
    const accountId = getActiveAccountId(state)
    return {
      disabled: state.organization.updating,
      role: state.organization.roles.find(r => r.id === roleID) || { ...DEFAULT_ROLE },
      tags: selectTags(state, accountId),
    }
  })
  const [form, setForm] = useState<IOrganizationRole>()
  const [count, setCount] = useState<number>()
  const systemRole = ['ADMIN', 'MEMBER'].includes(role.type)
  const fullAccess = form?.access === 'UNLIMITED'

  const changeForm = async (changedForm: IOrganizationRole) => {
    setForm(changedForm)
    setCount(undefined)
    let filter = {}
    if (changedForm.access !== 'UNLIMITED' && changedForm.tags.length)
      filter = {
        tag: {
          values: changedForm.tags.map(t => t.name),
          operator: changedForm.access,
        },
      }
    const result = await dispatch.devices.fetchCount(filter)
    setCount(result)
  }

  useEffect(() => {
    if (role.id !== form?.id) changeForm(role)
    analyticsHelper.page('OrganizationRolePage')
  }, [roleID])

  if (!form) return null

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{role.name || 'New Role'}</Title>
        </Typography>
      }
    >
      <List className={css.form}>
        <Typography variant="subtitle1">Role</Typography>
        <ListItem>
          <TextField
            required
            fullWidth
            autoFocus={true}
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
            label="Device access"
            value={form.access}
            variant="filled"
            onChange={event => {
              const access = event.target.value as IOrganizationRole['access']
              changeForm({ ...form, access })
            }}
          >
            <MenuItem value="UNLIMITED">All devices</MenuItem>
            <MenuItem value={fullAccess ? 'ANY' : form.access}>Tagged devices</MenuItem>
          </TextField>
          <ListItemSecondaryAction>
            <Chip color="primary" label={count === undefined ? 'Counting...' : `${count} devices`} size="small" />
          </ListItemSecondaryAction>
        </ListItem>
        {!fullAccess && (
          <>
            <ListItem>
              {/* <InputLabel shrink>Device Filter</InputLabel> */}
              <Tags
                tags={form.tags}
                onDelete={tag => {
                  let tags = [...form.tags]
                  const index = findTagIndex(tags, tag.name)
                  tags.splice(index, 1)
                  changeForm({ ...form, tags })
                }}
                onClick={tag => {
                  dispatch.devices.set({ tag: { values: [tag.name] } })
                  dispatch.devices.fetch()
                  history.push('/devices')
                }}
              />
              <TagEditor
                allowAdding={false}
                // onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
                onSelect={tag => {
                  let tags = [...form.tags]
                  tags.push(tag)
                  changeForm({ ...form, tags })
                }}
                tags={tags}
                filter={form.tags}
              />
              &nbsp;
              <ListItemSecondaryAction>
                <Typography variant="caption">Match: &nbsp;</Typography>
                <TextField
                  select
                  hiddenLabel
                  size="small"
                  disabled={disabled}
                  value={form.access}
                  variant="filled"
                  onChange={event => changeForm({ ...form, access: event.target.value as IOrganizationRole['access'] })}
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
          </>
        )}
      </List>
      <Typography variant="subtitle1">Permissions</Typography>
      <List>
        {Object.keys(PERMISSION).map(p => {
          const permission = p as IPermission
          const allowed = form.permissions.includes(permission)
          if (systemRole && !allowed) return null
          return (
            <ListItemSetting
              toggle={systemRole ? undefined : allowed}
              disabled={disabled}
              icon={PERMISSION[p].icon}
              label={PERMISSION[p].name}
              subLabel={PERMISSION[p].description}
              onClick={
                systemRole
                  ? undefined
                  : () => {
                      if (allowed) {
                        setForm({ ...form, permissions: form.permissions.filter(fp => fp !== permission) })
                      } else {
                        setForm({ ...form, permissions: [...form.permissions, permission] })
                      }
                    }
              }
            />
          )
        })}
      </List>
      {!systemRole && (
        <Gutters top="lg">
          <Button variant="contained" color="primary" disabled={disabled} onClick={console.log}>
            Save
          </Button>
          <Button onClick={() => history.push('/account/organization')}>Cancel</Button>
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
