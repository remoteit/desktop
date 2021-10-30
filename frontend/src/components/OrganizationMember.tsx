import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { LicenseSelect } from './LicenseSelect'
import { RoleSelect } from './RoleSelect'
import { Duration } from './Duration'
import { Avatar } from './Avatar'
import { spacing } from '../styling'

type Props = { member: IOrganizationMember; freeLicenses?: boolean; removing?: boolean; onClick?: () => void }

export const OrganizationMember: React.FC<Props> = ({ member, freeLicenses, removing, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  return (
    <ListItem key={member.user.email} dense>
      <ListItemIcon>
        <Avatar email={member.user.email} size={spacing.lg} />
      </ListItemIcon>
      <ListItemText
        primary={member.user.email}
        secondary={
          <>
            Added <Duration startDate={member?.created} ago />
          </>
        }
      />
      <ListItemSecondaryAction>
        <LicenseSelect member={member} disabled={!freeLicenses} />
        <span className={css.fixedWidth}>
          <RoleSelect member={member} />
        </span>
        <ConfirmButton
          confirm
          confirmMessage="This will remove all access to this organization’s devices."
          confirmTitle="Are you sure?"
          title="Remove Account"
          icon="times"
          size="sm"
          color={removing ? 'danger' : undefined}
          loading={removing}
          disabled={!onClick || removing}
          onClick={() => {
            onClick && onClick()
            dispatch.organization.removeMember(member)
          }}
        />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const useStyles = makeStyles({
  fixedWidth: {
    width: '120px',
    marginRight: spacing.md,
    display: 'inline-block',
    textAlign: 'right',
  },
})
