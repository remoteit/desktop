import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles, TextField, Typography, Button } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { selectLicense, REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { spacing } from '../styling'
import { Gutters } from './Gutters'
import { Link } from 'react-router-dom'
import { Body } from './Body'

export const OrganizationEmpty: React.FC = () => {
  const { name, licensed } = useSelector((state: ApplicationState) => ({
    name: (state.auth.user?.email || '').split('@')[0],
    licensed: !!selectLicense(state, REMOTEIT_PRODUCT_ID).license?.plan.commercial,
    // licensed: !!getLimit('org-users', state), // Would be better
  }))
  const [create, setCreate] = React.useState<string>(`${name}'s org`)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  return (
    <Body center>
      {licensed ? (
        <>
          <Typography variant="body2" align="center" color="textSecondary">
            Create an organization to pay for accounts <br /> and automatically share devices to your members.
          </Typography>
          <Gutters bottom="xxl">
            <form
              className={css.form}
              onSubmit={event => {
                event.preventDefault()
                dispatch.organization.setOrganization(create)
              }}
            >
              <TextField
                autoFocus
                label="Name"
                size="small"
                variant="filled"
                value={create}
                placeholder={create}
                onChange={event => setCreate(event.target.value.toString())}
              />
              <Button variant="contained" color="primary" type="submit" size="large">
                Create
              </Button>
            </form>
          </Gutters>
        </>
      ) : (
        <>
          <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
            Professional license required.
          </Typography>
          <Typography variant="h2" align="center" gutterBottom>
            Add an organization to automatically <br />
            share all your devices and manage access.
          </Typography>
          <Gutters bottom="xxl">
            <Button variant="contained" color="primary" component={Link} to="/settings/plans" size="large">
              Upgrade
            </Button>
          </Gutters>
        </>
      )}
    </Body>
  )
}

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    '& .MuiTextField-root': {
      width: 260,
      margin: spacing.xs,
    },
  },
})
