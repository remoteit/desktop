import React from 'react'
import { useHistory } from 'react-router-dom'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles, TextField, Typography, Button } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { spacing } from '../styling'
import { Gutters } from '../components/Gutters'
import { Body } from '../components/Body'

export const OrganizationEmptyPage: React.FC = () => {
  const username = useSelector((state: ApplicationState) => (state.auth.user?.email || '').split('@')[0])
  const [name, setName] = React.useState<string>(`${username}'s org`)
  const history = useHistory()
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
          onSubmit={async event => {
            event.preventDefault()
            await dispatch.organization.setOrganization({ name })
            history.push('/organization')
          }}
        >
          <TextField
            autoFocus
            label="Name"
            variant="filled"
            value={name}
            placeholder={name}
            onChange={event => setName(event.target.value.toString())}
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
