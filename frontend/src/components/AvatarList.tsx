import React from 'react'
import { makeStyles } from '@material-ui/core'
import { AvatarGroup } from '@material-ui/lab'
import { Avatar } from './Avatar'

export interface Props {
  users?: IUser[]
  size?: number
}

export const AvatarList: React.FC<Props> = ({ users, size = 22 }) => {
  const spacing = size * 0.25
  const css = useStyles({ size, spacing })

  if (!users) return null

  return (
    <AvatarGroup spacing={spacing} max={8} className={css.group}>
      {users.map((u, i) => (
        <Avatar key={i} email={u.email} size={size} />
      ))}
    </AvatarGroup>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  group: ({ size, spacing }: { size: number; spacing: number }) => ({
    '& .MuiAvatar-root + .MuiAvatar-root': {
      marginLeft: -spacing,
    },
    '& .MuiAvatarGroup-avatar': {
      backgroundColor: palette.grayDark.main,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: palette.white.main,
      fontSize: size * 0.5,
      lineHeight: size,
      fontWeight: 'bold',
      height: size,
      width: size,
      fontFace: 'Roboto Mono',
    },
  }),
}))
