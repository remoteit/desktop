import React, { useState } from 'react'
import { Typography, List, ListItem, TextField, Button, Collapse, FormHelperText, ListSubheader } from '@mui/material'
import { serviceNameValidation } from '@common/nameHelper'
import { ListItemCheckbox } from './ListItemCheckbox'
import { CopyCodeBlock } from './CopyCodeBlock'
import { sanitizeUrl } from '../helpers/connectionHelper'
import { windowOpen } from '../services/browser'
import { Quote } from './Quote'
import { Body } from './Body'
type Props = {
  registrationCode?: string
}

export const RentANodeForm: React.FC<Props> = ({ registrationCode }) => {
  const [form, setForm] = useState({
    deviceName: '',
    sshPublicKey: '',
    useIpv6: false,
    openPorts: '',
    useDns: false,
  })
  const [nameError, setNameError] = useState<string>()

  const formId = '1FAIpQLSfYourGoogleFormIdHere' // Replace with actual Google Form ID

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    // Construct Google Form URL with prefilled values
    const formUrl =
      `https://docs.google.com/forms/d/e/${formId}/viewform?usp=pp_url` +
      `&entry.1=${encodeURIComponent(form.deviceName)}` +
      `&entry.2=${encodeURIComponent(form.sshPublicKey)}` +
      `&entry.3=${encodeURIComponent(form.useIpv6 ? form.openPorts : '')}` +
      `&entry.4=${encodeURIComponent(registrationCode || '')}` +
      `&entry.5=${encodeURIComponent(form.useDns ? 'yes' : 'no')}`

    windowOpen(formUrl)
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
              error={!!nameError}
              helperText={nameError}
              InputLabelProps={{ shrink: true }}
              onChange={event => {
                const validation = serviceNameValidation(event.target.value)
                if (validation.error) {
                  setNameError(validation.error)
                } else {
                  setNameError(undefined)
                }
                setForm({ ...form, deviceName: validation.value })
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
        disabled={!!nameError || !form.deviceName || !form.sshPublicKey}
      >
        Submit Request
      </Button>
    </form>
  )
}
