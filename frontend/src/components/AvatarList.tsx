import React from 'react'
import { AvatarGroup } from '@mui/material'
import { Avatar } from './Avatar'

export interface Props {
  users?: IUser[]
  size?: number
}

export const AvatarList: React.FC<Props> = ({ users, size = 22 }) => {
  if (!users) return null

  return (
    <AvatarGroup
      max={8}
      variant="square"
      slotProps={{
        additionalAvatar: {
          sx: {
            borderColor: 'transparent !important',
            paddingLeft: `${size * 0.5}px`,
            maxHeight: size,
            background: 'none',
            color: 'grayDark.main',
            fontSize: size * 0.625,
            fontFamily: 'Roboto Mono',
          },
        },
      }}
    >
      {users.map((u, i) => (
        <Avatar key={i} email={u.email} size={size} />
      ))}
    </AvatarGroup>
  )
}
