import React, { useState } from 'react'
import { State } from '../store'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MuiTelInput, matchIsValidTel } from 'mui-tel-input'
import { selectOrganization } from '../selectors/organizations'
import { Typography, List, ListItem, TextField, Button, Collapse, FormHelperText } from '@mui/material'
import { serviceNameValidation } from '@common/nameHelper'
import { ListItemCheckbox } from './ListItemCheckbox'
import { CopyCodeBlock } from './CopyCodeBlock'
import { sanitizeUrl } from '../helpers/connectionHelper'
import { rentANode } from '../helpers/apiHelper'
import { Quote } from './Quote'
import { Body } from './Body'

type Props = {
  registrationCode?: string
}

export const RentANodeForm: React.FC<Props> = ({ registrationCode }) => {
  const history = useHistory()
  const user = useSelector((state: State) => state.user)
  const organization = useSelector(selectOrganization)
  const { AWSUser } = useSelector((state: State) => state.auth)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    deviceName: '',
    phone: '',
    sshPublicKey: '',
    useIpv6: false,
    openPorts: '',
    useDns: false,
  })
  const [error, setError] = useState<Record<string, string | undefined>>({})

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    await rentANode([
      new Date().toISOString().slice(0, -1), // timestamp
      AWSUser.given_name ? AWSUser.given_name + ' ' + AWSUser.family_name : 'Unknown', // name
      user.email, // email
      "'" + (form.phone ?? AWSUser.phone_number ?? ''), // phone
      organization.name, // org-name
      user.email, // remoteit-email
      form.deviceName, // name
      'Public SSH Key', // public ssh-key-name
      form.sshPublicKey, // public ssh-key
      form.useIpv6 ? form.openPorts || 'All' : 'None', // ipv6-ports
      form.useDns ? getDnsWebAccess() : 'None', // dns-name
      '', // sales-rep
      registrationCode ?? '', // reg-code
      organization.id, // remoteit-org-id
      organization.name, // remoteit-org-name
      user.id, // remoteit-user-id
    ])

    setSubmitting(false)
    history.push('/')
  }

  const getDnsWebAccess = () => {
    const safeName = form.deviceName ? sanitizeUrl(form.deviceName) : '[device-name]'
    return `${safeName}.telepath.cachengo.com`
  }

  return (
    <form onSubmit={handleSubmit}>
      <List disablePadding>
        <Typography variant="h3" color="textPrimary" my={2}>
          Node Rental Form
        </Typography>
        <Body maxHeight="400px" verticalOverflow>
          <ListItem disableGutters>
            <TextField
              required
              fullWidth
              label="Device Name"
              value={form.deviceName}
              variant="filled"
              error={!!error.deviceName}
              helperText={error.deviceName}
              InputLabelProps={{ shrink: true }}
              onChange={event => {
                const validation = serviceNameValidation(event.target.value)
                if (validation.error) setError({ ...error, deviceName: validation.error })
                else setError({ ...error, deviceName: undefined })
                setForm({ ...form, deviceName: validation.value })
              }}
            />
          </ListItem>
          <ListItem disableGutters>
            <MuiTelInput
              required
              fullWidth
              label="Phone"
              variant="filled"
              value={form.phone}
              defaultCountry="US"
              error={!!error.phone}
              helperText={error.phone}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiInputBase-input': { paddingLeft: 0 } }}
              onChange={phone => {
                setError({ ...error, phone: matchIsValidTel(phone) ? undefined : 'Invalid phone number' })
                setForm({ ...form, phone })
              }}
            />
          </ListItem>
          <ListItem disableGutters>
            <TextField
              required
              multiline
              fullWidth
              maxRows={3}
              label="SSH Public Key"
              value={form.sshPublicKey}
              variant="filled"
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: { fontSize: '14px' } }}
              onChange={event => setForm({ ...form, sshPublicKey: event.target.value })}
            />
          </ListItem>
          <ListItemCheckbox
            disableGutters
            label="Add a public IPv6 address"
            checked={form.useIpv6}
            onClick={checked => setForm({ ...form, useIpv6: checked })}
          />
          <Collapse in={form.useIpv6}>
            <Quote margin={null} indent="listItem">
              <TextField
                fullWidth
                label="Open Ports"
                value={form.openPorts}
                variant="filled"
                placeholder="All"
                InputLabelProps={{ shrink: true }}
                onChange={event => setForm({ ...form, openPorts: event.target.value })}
                helperText="Please enter a comma separated list of ports, or leave blank to open all ports."
              />
            </Quote>
          </Collapse>
          <ListItemCheckbox
            disableGutters
            label="Add a public DNS address"
            checked={form.useDns}
            onClick={checked => setForm({ ...form, useDns: checked })}
          />
          <Collapse in={form.useDns}>
            <Quote margin={null} indent="listItem">
              <CopyCodeBlock value={getDnsWebAccess()} hideCopyLabel />
              <FormHelperText sx={{ marginLeft: 2 }}>
                You will be able to access your node at this address.
              </FormHelperText>
            </Quote>
          </Collapse>
          <ListItem disableGutters>
            <Typography variant="body2" color="textSecondary" my={3}>
              Please allow up to two business days for your rental request to be processed. If you have any questions
              please contact us at <a href="mailto:support@cachengo.com">support@cachengo.com</a>
            </Typography>
          </ListItem>
        </Body>
      </List>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!!error.deviceName || !!error.phone || !form.deviceName || !form.sshPublicKey}
      >
        {submitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  )
}
