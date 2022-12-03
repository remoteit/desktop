import React, { useEffect, useState } from 'react'
import { getDevices } from '../models/accounts'
import { REGEX_LAST_PATH } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { getFreeLicenses, selectRemoteitLicense } from '../models/plans'
import { selectAccessibleNetworks, selectNetworks } from '../models/networks'
import { ApplicationState, Dispatch } from '../store'
import { Typography, List, Box, Divider } from '@mui/material'
import { ListItemLocation } from '../components/ListItemLocation'
import { TargetPlatform } from '../components/TargetPlatform'
import { ShareDetails } from '../components/ShareDetails'
import { RoleAccessCounts } from '../components/RoleAccessCounts'
import { getOrganization } from '../models/organization'
import { LoadingMessage } from '../components/LoadingMessage'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { LicenseSelect } from '../components/LicenseSelect'
import { RoleSelect } from '../components/RoleSelect'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const OrganizationGuestPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { userID = '' } = useParams<{ userID: string }>()
  const [removing, setRemoving] = useState<boolean>(false)
  const { devices, member, accessible, networks, freeLicenses, organization, guest, guestsLoaded, license } =
    useSelector((state: ApplicationState) => {
      const organization = getOrganization(state)
      const guest = organization.guests.find(g => g.id === userID)
      const member = organization.members.find(m => m.user.id === userID)
      return {
        guest,
        member,
        organization,
        freeLicenses: getFreeLicenses(state),
        license: selectRemoteitLicense(state),
        devices: getDevices(state).filter(device => guest?.deviceIds.includes(device.id)),
        accessible: selectAccessibleNetworks(state, organization, member),
        networks: selectNetworks(state),
        guestsLoaded: organization.guestsLoaded,
      }
    })

  const enterprise = !!license && !license.plan.billing
  const user = guest || member?.user
  const role = organization.roles.find(r => r.id === member?.roleId)

  useEffect(() => {
    if (!user) history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
  }, [user])

  useEffect(() => {
    const missing = guest?.deviceIds.filter(id => !devices.find(device => device.id === id))
    if (missing?.length) dispatch.devices.fetchDevices(missing)
  }, [devices])

  useEffect(() => {
    if (!guestsLoaded) dispatch.organization.fetchGuests()
  }, [guest])

  return (
    <Container
      header={
        <Typography variant="h1" gutterBottom>
          <Title>
            <Avatar email={user?.email} inline />
            {user?.email}
          </Title>
          {member && (
            <ConfirmButton
              confirm
              confirmMessage={
                <>
                  This will remove <b>{member.user.email}’s </b>
                  access to all the organization’s devices
                </>
              }
              confirmTitle="Are you sure?"
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
      }
    >
      {member && (
        <>
          <Typography variant="subtitle1">Member</Typography>
          <Gutters>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" marginRight={2} gap={2}>
                <RoleSelect
                  size="medium"
                  roles={organization.roles}
                  roleId={member.roleId}
                  onSelect={(roleId: string) => dispatch.organization.setMembers([{ ...member, roleId }])}
                />
                {!enterprise && (
                  <LicenseSelect
                    size="medium"
                    member={member}
                    disabled={!freeLicenses && member.license !== 'LICENSED'}
                  />
                )}
              </Box>
              <Box display="flex">
                <RoleAccessCounts role={role} />
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
                pathname={`/networks/${network.id}`}
                icon={network ? <Icon name={network.icon} size="md" /> : <Icon name="spinner-third" spin />}
                title={network ? network.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
              />
            ))}
          </List>
        </>
      )}
      {!guestsLoaded && <LoadingMessage inline />}
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
                  pathname={`${location.pathname}/${id}`}
                  icon={
                    device ? (
                      <TargetPlatform id={device?.targetPlatform} size="md" />
                    ) : (
                      <Icon name="spinner-third" spin />
                    )
                  }
                  title={device ? device.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
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
                  pathname={`/networks/${id}`}
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
