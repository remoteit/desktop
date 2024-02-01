import React, { useEffect, useState } from 'react'
import { getAllDevices } from '../selectors/devices'
import { REGEX_LAST_PATH } from '../constants'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { selectOrganization, selectRemoteitLicense } from '../selectors/organizations'
import { getFreeUsers } from '../models/plans'
import { selectAccessibleNetworks } from '../models/networks'
import { selectNetworks } from '../selectors/networks'
import { ApplicationState, Dispatch } from '../store'
import { Typography, List, Box, Divider } from '@mui/material'
import { ListItemLocation } from '../components/ListItemLocation'
import { TargetPlatform } from '../components/TargetPlatform'
import { ShareDetails } from '../components/ShareDetails'
import { RoleAccessCounts } from '../components/RoleAccessCounts'
import { LinearProgress } from '../components/LinearProgress'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { LicenseSelect } from '../components/LicenseSelect'
import { RoleSelect } from '../components/RoleSelect'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const OrganizationUserPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { userID = '' } = useParams<{ userID: string }>()
  const [removing, setRemoving] = useState<boolean>(false)
  const [fetched, setFetched] = useState<boolean>(false)
  const { devices, member, accessible, networks, freeUsers, organization, guest, guestsLoaded, license } = useSelector(
    (state: ApplicationState) => {
      const organization = selectOrganization(state)
      const guest = organization.guests.find(g => g.id === userID)
      const member = organization.members.find(m => m.user.id === userID)
      return {
        guest,
        member,
        organization,
        freeUsers: getFreeUsers(state),
        license: selectRemoteitLicense(state),
        devices: getAllDevices(state).filter(device => guest?.deviceIds.includes(device.id)),
        accessible: selectAccessibleNetworks(state, organization, member),
        networks: selectNetworks(state),
        guestsLoaded: organization.guestsLoaded,
      }
    }
  )

  const enterprise = !!license && !license.plan.billing
  const user = guest || member?.user
  const role = organization.roles.find(r => r.id === member?.roleId)

  useEffect(() => {
    if (!user) history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
    setFetched(false)
    const missing = guest?.deviceIds.filter(id => !devices.find(device => device.id === id))
    if (missing?.length && !fetched) {
      ;(async () => {
        await dispatch.devices.fetchDevices({ ids: missing, hidden: true })
        setFetched(true)
      })()
    }
  }, [user])

  useEffect(() => {
    if (!guestsLoaded) dispatch.organization.fetchGuests()
  }, [guest])

  return (
    <Container
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>
              <Avatar email={user?.email} inline />
              {user?.email}
            </Title>
            {member && (
              <ConfirmIconButton
                confirm
                confirmProps={{
                  children: (
                    <>
                      This will remove <b>{member.user.email}’s </b>
                      access to all the organization’s devices
                    </>
                  ),
                }}
                title="Remove Member"
                icon="trash"
                size="md"
                color={removing ? 'danger' : undefined}
                loading={removing}
                disabled={removing}
                onClick={async () => {
                  setRemoving(true)
                  await dispatch.organization.removeMember(member)
                  setRemoving(false)
                }}
              />
            )}
          </Typography>
          {!guestsLoaded && <LinearProgress loading />}
        </>
      }
    >
      {member && (
        <>
          <Typography variant="subtitle1">Member</Typography>
          <Gutters>
            <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between">
              <Box display="flex" marginRight={2} gap={1}>
                <RoleSelect
                  size="medium"
                  roles={organization.roles}
                  roleId={member.roleId}
                  onSelect={(roleId: string) => dispatch.organization.setMembers([{ ...member, roleId }])}
                />
                {!enterprise && (
                  <LicenseSelect size="medium" member={member} disabled={!freeUsers && member.license !== 'LICENSED'} />
                )}
              </Box>
              <Box display="flex" marginTop={1}>
                {role && <RoleAccessCounts role={role} />}
              </Box>
            </Box>
          </Gutters>
        </>
      )}
      {!!accessible.length && (
        <>
          <Typography variant="subtitle1">Networks</Typography>
          <List>
            {accessible.map(network => (
              <ListItemLocation
                key={network.id}
                to={`/networks/${network.id}`}
                icon={network ? <Icon name={network.icon} size="md" /> : <Icon name="spinner-third" spin />}
                title={network ? network.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
              />
            ))}
          </List>
        </>
      )}
      {(guest?.deviceIds.length || guest?.networkIds.length) && (
        <>
          <Gutters top="xl">
            <Typography variant="h2">Guest Access</Typography>
          </Gutters>
          <Divider variant="inset" />
        </>
      )}
      {!!guest?.deviceIds.length && (
        <>
          <Typography variant="subtitle1">Devices</Typography>
          <List>
            {guest?.deviceIds.map(id => {
              const device = devices.find(d => d.id === id)
              return (
                <ListItemLocation
                  key={id}
                  to={`/devices/${id}/users/${user?.id || userID}`}
                  icon={
                    device ? (
                      <TargetPlatform id={device?.targetPlatform} size="md" />
                    ) : fetched ? (
                      <Icon name="exclamation-triangle" />
                    ) : (
                      <Icon name="spinner-third" spin />
                    )
                  }
                  title={
                    device ? (
                      device.name
                    ) : (
                      <Box sx={{ opacity: 0.4 }}>{fetched ? `Loading failed (${id})` : 'loading...'}</Box>
                    )
                  }
                >
                  <ShareDetails user={guest} device={device} />
                </ListItemLocation>
              )
            })}
          </List>
        </>
      )}
      {!!guest?.networkIds.length && (
        <>
          <Typography variant="subtitle1">Networks</Typography>
          <List>
            {guest?.networkIds.map(id => {
              const network = networks.find(d => d.id === id)
              return (
                <ListItemLocation
                  key={id}
                  to={`/networks/${id}`}
                  icon={network ? <Icon name={network.icon} size="md" /> : <Icon name="spinner-third" spin />}
                  title={network ? network.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
                />
              )
            })}
          </List>
        </>
      )}
    </Container>
  )
}
