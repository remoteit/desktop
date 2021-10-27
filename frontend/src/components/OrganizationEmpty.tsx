import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles, TextField, Typography, Button } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { spacing } from '../styling'
import { Gutters } from './Gutters'
import { Body } from './Body'

export const OrganizationEmpty: React.FC = () => {
  const { name } = useSelector((state: ApplicationState) => ({
    name: (state.auth.user?.email || '').split('@')[0],
    // licensed: !!selectLicense(state, REMOTEIT_PRODUCT_ID).license?.plan.commercial,
    // licensed: !!getLimit('org-users', state), // Would be better
  }))
  const [create, setCreate] = React.useState<string>(`${name}'s org`)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  return (
    <Body center>
      <Typography variant="body2" align="center" color="textSecondary">
        Create an organization to <br />
        automatically share devices to your members.
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
