import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import { useHistory } from 'react-router-dom'
import { Dispatch, State } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { Box, TextField, Typography, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { spacing } from '../styling'
import { Gutters } from '../components/Gutters'
import { Body } from '../components/Body'

export const OrganizationEmptyPage: React.FC = () => {
  const { t } = useTranslation()
  const { username, hasOrganization } = useSelector((state: State) => ({
    username: (state.auth.user?.email || '').split('@')[0],
    hasOrganization: selectOrganization(state)?.id && state.organization.initialized,
  }))
  const [name, setName] = React.useState<string>(`${username}'s org`)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  if (hasOrganization) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Body center>
      <Typography variant="body2" align="center" color="textSecondary">
        {t('organizationEmptyPage.createOrgLine1', 'Create an organization to')} <br />
        {t('organizationEmptyPage.createOrgLine2', 'automatically share devices to your members.')}
      </Typography>
      <Gutters bottom="xxl">
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            '& .MuiTextField-root': { width: 260, margin: `${spacing.xs}px` },
          }}
          onSubmit={async event => {
            event.preventDefault()
            await dispatch.organization.setOrganization({ name })
            history.push('/organization')
          }}
        >
          <TextField
            autoFocus
            label={t('organizationEmptyPage.name', 'Name')}
            variant="filled"
            value={name}
            placeholder={name}
            onChange={event => setName(event.target.value.toString())}
          />
          <Button variant="contained" color="primary" type="submit" size="large">
            {t('organizationEmptyPage.create', 'Create')}
          </Button>
        </Box>
      </Gutters>
    </Body>
  )
}

