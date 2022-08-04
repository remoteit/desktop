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
    <AvatarGroup max={8}>
      {users.map((u, i) => (
        <Avatar key={i} email={u.email} size={size} />
      ))}
    </AvatarGroup>
  )
}
