import React, { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { isEqual } from 'lodash'
import { useHistory } from 'react-router-dom'
import { REGEX_EMAIL_DOMAIN } from '../shared/constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, TextField, Button, List, ListItem } from '@material-ui/core'
import { ListItemCheckbox } from '../components/ListItemCheckbox'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { FileUpload } from '../components/FileUpload'
import { Quote } from '../components/Quote'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationSAMLPage: React.FC = () => {
  const { emailDomain, saml } = useSelector((state: ApplicationState) => ({
    emailDomain: state.auth.user?.email.split('@')[1],
    saml: {
      enabled: true,
      domain: '',
      metadata: '',
      samlOnly: false,
    },
  }))
  const history = useHistory()
  const [form, setForm] = useState<ILookup<string | boolean>>(saml)
  const [error, setError] = useState<string>('')
  // const dispatch = useDispatch<Dispatch>()
  const disabled = isEqual(form, saml)

  useEffect(() => {
    analyticsHelper.page('OrganizationSAMLPage')
  }, [])

  const exit = () => history.push('/account/organization')
  const submit = () => {
    // dispatch.organization.setMembers(
    // emails.map(email => ({
    //   role,
    //   created: new Date(),
    //   license: freeLicenses ? 'LICENSED' : 'UNLICENSED',
    //   organizationId: organization.id || '',
    //   user: { email, id: '' },
    // }))
    // )
    exit()
  }

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Organization Settings</Title>
        </Typography>
      }
    >
      <List disablePadding>
        <ListItemCheckbox
          label="Enable SAML"
          subLabel="Single sign on for users"
          checked={!!form.enabled}
          onClick={() => setForm({ ...form, enabled: !form.enabled })}
        />
        <ListItem dense>
          <Quote margin={null} noInset listItem>
            <List disablePadding>
              <ListItem>
                <TextField
                  required
                  fullWidth
                  disabled
                  label="Email Domain"
                  value={emailDomain}
                  // disabled={!form.enabled}
                  error={!!error}
                  variant="filled"
                  helperText={error}
                  onChange={event => {
                    const value = event.target.value.toString()
                    const result = value.match(REGEX_EMAIL_DOMAIN)
                    if (result && result[0] === value) {
                      setError('')
                    } else {
                      setError('Must be an email domain (@example.com)')
                    }
                    setForm({ ...form, domain: value })
                  }}
                />
              </ListItem>
              <ListItem>
                <FileUpload onUpload={metadata => setForm({ ...form, metadata })} />
              </ListItem>
              <ListItemCheckbox
                label="Use SAML only"
                subLabel="Users will not be able to login with email/password"
                disabled={!form.enabled}
                checked={!!form.samlOnly}
                onClick={() => setForm({ ...form, samlOnly: !form.samlOnly })}
              />
            </List>
          </Quote>
        </ListItem>
      </List>
      <Gutters>
        <Button variant="contained" color="primary" disabled={disabled || !!error} onClick={submit}>
          Save
        </Button>
        <Button onClick={exit}>Cancel</Button>
        {form.metadata && <pre>{form.metadata}</pre>}
      </Gutters>
    </Container>
  )
}
