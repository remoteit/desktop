import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, List, Typography, TextField, MenuItem, Box } from '@mui/material'
import { REGEX_IP_SAFE, REGEX_VALID_HOSTNAME } from '../../constants'
import { IP_OPEN, IP_LATCH, IP_PRIVATE } from '@common/constants'
import { ListItemSetting } from '../../components/ListItemSetting'
import { setConnection } from '../../helpers/connectionHelper'
import { selectConnection } from '../../selectors/connections'
import { selectById } from '../../selectors/devices'
import { AccordionMenuItem } from '../../components/AccordionMenuItem'
import { ListItemBack } from '../../components/ListItemBack'
import { Gutters } from '../../components/Gutters'
import { spacing } from '../../styling'

const containerSx = {
  paddingLeft: `${spacing.xl}px`,
  margin: `${spacing.sm}px ${spacing.xxl}px ${spacing.lg}px`,
  '& > p': { marginBottom: `${spacing.md}px` },
  '& > div': { marginBottom: `${spacing.sm}px` },
}
import { State } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { maskIPClass } from '../../helpers/lanSharing'
import { Quote } from '../../components/Quote'

type Selections = { value: string | Function; name: string; note: string; id: number }

export const LanSharePage: React.FC = () => {
  const { t } = useTranslation()
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const { service, lanIp, connection } = useSelector((state: State) => {
    const [service] = selectById(state, undefined, serviceID)
    return {
      service,
      lanIp: state.backend.environment.privateIP,
      connection: selectConnection(state, service),
    }
  })

  const [currentIp, setCurrentIp] = useState((connection && connection.ip) || IP_PRIVATE)

  // prettier-ignore
  const selections: Selections[] = [
    { id: 0, value: IP_LATCH, name: t('lanSharePage.ipLatchingName', 'IP Latching'), note: t('lanSharePage.ipLatchingNote', 'Allow any single device on the local network to connect. IP restriction will be set to the IP address of the first device that connects.') },
    { id: 1, value: maskIPClass(lanIp, 'A'), name: t('lanSharePage.classARestrictionName', 'Class-A Restriction'), note: t('lanSharePage.classARestrictionNote', 'IP restricted to the local network') },
    { id: 2, value: maskIPClass(lanIp, 'B'), name: t('lanSharePage.classBRestrictionName', 'Class-B Restriction'), note: t('lanSharePage.classBRestrictionNote', 'Narrowly IP restrict on the local network') },
    { id: 3, value: maskIPClass(lanIp, 'C'), name: t('lanSharePage.classCRestrictionName', 'Class-C Restriction'), note: t('lanSharePage.classCRestrictionNote', 'Focused IP restriction on the local network') },
    { id: 4, value: () => address, name: t('lanSharePage.singleIpRestrictionName', 'Single IP Restriction'), note: t('lanSharePage.singleIpRestrictionNote', 'Only allow a single IP address to connect to this device on the local network.') },
    { id: 5, value: IP_OPEN, name: t('lanSharePage.noneName', 'None'), note: t('lanSharePage.noneNote', 'Available to all incoming requests.') },
  ]

  const [enabledLocalSharing, setEnabledLocalSharing] = useState<boolean>(connection.ip !== IP_PRIVATE)
  const restriction: ipAddress = enabledLocalSharing && connection.restriction ? connection.restriction : IP_LATCH
  const [selection, setSelection] = useState<number>(() => {
    let s = selections.findIndex(s => s.value === restriction)
    if (s === -1) s = selections.findIndex(s => typeof s.value === 'function')
    return s
  })
  const [address, setAddress] = useState<string>(restriction || '192.168.')
  const selected = selections[selection] || {}
  const history = useHistory()
  const [error, setError] = useState<string>()
  const [disabled, setDisabled] = useState(true)

  const getSelectionValue = () => {
    if (!enabledLocalSharing) return IP_PRIVATE
    const value = selected.value
    return typeof value === 'function' ? value() : value
  }

  const getSelectionMask = () => {
    switch (selected.id) {
      case 1:
        return '/8'
      case 2:
        return '/16'
      case 3:
        return '/24'
      default:
        return ''
    }
  }

  if (!connection || !service) return null

  const save = () => {
    setConnection({
      ...connection,
      ip: enabledLocalSharing ? currentIp : IP_PRIVATE,
      restriction: getSelectionValue(),
    })
    history.goBack()
  }

  const handleLocalNetworkSecurity = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelection(parseInt(event.target.value))
    setDisabled(false)
  }

  const handleBindIP = event => {
    const { value } = event.target
    setCurrentIp(value)

    if (!REGEX_VALID_HOSTNAME.test(value)) {
      setError(t('lanSharePage.invalidIp', 'invalid IP'))
      setDisabled(true)
    } else {
      setError('')
      setDisabled(false)
    }
  }

  const handleEnableLocalSharing = () => {
    const setSharing = !enabledLocalSharing
    setCurrentIp(setSharing ? IP_OPEN : IP_PRIVATE)
    setEnabledLocalSharing(setSharing)
    setDisabled(false)
  }

  return (
    <Gutters size="md" bottom={null}>
      <Box display="flex">
        <ListItemBack title={t('lanSharePage.localNetworkSharing', 'Local Network Sharing')} to="connect" />
      </Box>
      <AccordionMenuItem gutters subtitle={t('lanSharePage.settings', 'Settings')} defaultExpanded disabled>
        <List>
          <ListItemSetting
            icon="network-wired"
            toggle={enabledLocalSharing}
            onClick={handleEnableLocalSharing}
            label={t('lanSharePage.enableLanSharing', 'Enable LAN sharing')}
          />
        </List>

        <Box sx={containerSx}>
          <div>
            <Typography variant="caption">{t('lanSharePage.yourLocalIpAddress', 'Your local IP address')}</Typography>
            <Typography variant="h3">{lanIp}</Typography>
          </div>
          <Typography variant="body2" color="textSecondary">
            {t(
              'lanSharePage.allowUsersToConnect',
              'Allow users to connect to your remote device through your IP address using a custom port.'
            )}
          </Typography>
          {enabledLocalSharing && (
            <>
              <TextField
                sx={{ minWidth: 300 }}
                multiline={currentIp.toString().length > 30}
                label={t('lanSharePage.bindIpAddress', 'Bind IP Address')}
                error={!!error}
                defaultValue={currentIp}
                variant="filled"
                helperText={error}
                onChange={handleBindIP}
              />
              <br />
              <TextField
                select
                sx={{ minWidth: 300 }}
                variant="filled"
                label={t('lanSharePage.localNetworkSecurity', 'Local Network Security')}
                value={selection.toString()}
                onChange={handleLocalNetworkSecurity}
              >
                {selections.map((option, key) => (
                  <MenuItem key={key} value={key.toString()}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="textSecondary">
                {selected.note} <br />
                <Box component="span" sx={{ fontStyle: 'italic' }}>
                  {t('lanSharePage.mask', {
                    value: `${getSelectionValue()}${getSelectionMask()}`,
                    defaultValue: 'Mask {{value}}',
                  })}
                </Box>
              </Typography>
              {typeof selected.value === 'function' && (
                <Quote>
                  <TextField
                    sx={{ minWidth: 300 }}
                    value={address}
                    variant="filled"
                    label={t('lanSharePage.ipAddress', 'IP address')}
                    onChange={event => setAddress(event.target.value.replace(REGEX_IP_SAFE, ''))}
                  />
                </Quote>
              )}
            </>
          )}
        </Box>
        <Box sx={containerSx}>
          <Button onClick={save} variant="contained" color="primary" disabled={disabled}>
            {t('lanSharePage.save', 'Save')}
          </Button>
          <Button onClick={() => history.goBack()}>{t('lanSharePage.cancel', 'Cancel')}</Button>
        </Box>
      </AccordionMenuItem>
    </Gutters>
  )
}

