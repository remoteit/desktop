import React from 'react'
import { State, Dispatch } from '../store'
import { IOrganizationState } from '../models/organization'
import { useSelector, useDispatch } from 'react-redux'
import { ENTERPRISE_PLAN_ID, getAvailableUsers } from '../models/plans'
import { selectRemoteitLicense, selectPermissions } from '../selectors/organizations'
import { selectAccessibleNetworks } from '../models/networks'
import { Typography, List, Box } from '@mui/material'
import { RoleAccessCounts } from './RoleAccessCounts'
import { ListItemLocation } from './ListItemLocation'
import { LicenseSelect } from './LicenseSelect'
import { RoleSelect } from './RoleSelect'
import { Duration } from '../components/Duration'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

type Props = {
  member: IOrganizationMember
  organization: IOrganizationState
}

export const OrganizationMemberDetails: React.FC<Props> = ({ member, organization }) => {
  const dispatch = useDispatch<Dispatch>()
  const permissions = useSelector((state: State) => selectPermissions(state))
  const availableUsers = useSelector((state: State) => getAvailableUsers(state))
  const accessible = useSelector((state: State) => selectAccessibleNetworks(state, organization, member))
  const license = useSelector((state: State) => selectRemoteitLicense(state))

  const enterprise = license?.plan.id === ENTERPRISE_PLAN_ID
  const role = organization.roles.find(r => r.id === member?.roleId)
  const disabled = !permissions?.includes('ADMIN')

  return (
    <>
      {member && (
        <>
          <Typography variant="subtitle1">Member</Typography>
          <Gutters>
            <Typography variant="caption" marginBottom={3} component="div">
              Since <Duration startTime={member?.created?.getTime()} ago />
            </Typography>
            <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between">
              <Box display="flex" marginRight={2} gap={1}>
                <RoleSelect
                  size="medium"
                  roles={organization.roles}
                  roleId={member.roleId}
                  onSelect={(roleId: string) => dispatch.organization.setMembers([{ ...member, roleId }])}
                  disabled={disabled}
                />
                {!enterprise && (
                  <LicenseSelect
                    size="medium"
                    member={member}
                    disabled={disabled || (!availableUsers && member.license !== 'LICENSED')}
                  />
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
                dense
                key={network.id}
                to={`/networks/${network.id}`}
                icon={network ? <Icon name={network.icon} /> : <Icon name="spinner-third" spin />}
                title={network ? network.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
              />
            ))}
          </List>
        </>
      )}
    </>
  )
}
