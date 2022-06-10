import React, { useEffect, useState } from 'react'
import { REGEX_LAST_PATH } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { getFreeLicenses, selectRemoteitLicense } from '../models/plans'
import { ApplicationState, Dispatch } from '../store'
import { Typography, List, Box } from '@material-ui/core'
import { ListItemLocation } from '../components/ListItemLocation'
import { TargetPlatform } from '../components/TargetPlatform'
import { ShareDetails } from '../components/ShareDetails'
import { getDevices } from '../models/accounts'
import { getOrganization } from '../models/organization'
import { Container } from '../components/Container'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { LicenseSelect } from '../components/LicenseSelect'
import { RoleSelect } from '../components/RoleSelect'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const OrganizationGuestPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const { userID = '' } = useParams<{ userID: string }>()
  const dispatch = useDispatch<Dispatch>()
  const [removing, setRemoving] = useState<boolean>(false)
  const { devices, freeLicenses, organization, license } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
    freeLicenses: getFreeLicenses(state),
    license: selectRemoteitLicense(state),
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
  }))

  const enterprise = !!license && !license.plan.billing
  const guest = organization.guests.find(g => g.id === userID)
  const member = organization.members.find(m => m.user.id === userID)
  const user = guest || member?.user

  useEffect(() => {
    if (!user) history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
  }, [user])

  return (
    <Container
      header={
        <Typography variant="h1" gutterBottom>
          <Title>
            <Avatar email={user?.email} inline />
            {user?.email}
          </Title>
        </Typography>
      }
    >
      {member && (
        <>
          <Typography variant="subtitle1">
            <Title>Member</Title>
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
              color={removing ? 'danger' : undefined}
              loading={removing}
              disabled={removing}
              onClick={async () => {
                setRemoving(true)
                await dispatch.organization.removeMember(member)
                setRemoving(false)
              }}
            />
          </Typography>
          <Gutters>
            <Box display="flex" alignItems="center">
              <RoleSelect
                size="medium"
                roles={organization.roles}
                roleId={member.roleId}
                license={member.license}
                onSelect={(roleId: string) => /* dispatch.organization.setMembers([{ ...member, roleId }]) */ {}}
              />
              {!enterprise && (
                <Box marginLeft={2}>
                  <LicenseSelect
                    size="medium"
                    member={member}
                    disabled={!freeLicenses && member.license !== 'LICENSED'}
                  />
                </Box>
              )}
            </Box>
          </Gutters>
        </>
      )}
      {guest && (
        <>
          <Typography variant="subtitle1">Devices</Typography>
          <List>
            {guest?.deviceIds.map(id => {
              const device = devices.find(d => d.id === id)
              return (
                <ListItemLocation
                  key={id}
                  pathname={`${location.pathname}/${id}`}
                  icon={<TargetPlatform id={device?.targetPlatform} size="md" />}
                  title={device?.name}
                >
                  <ShareDetails user={guest} device={device} />
                </ListItemLocation>
              )
            })}
          </List>
        </>
      )}
    </Container>
  )
}
