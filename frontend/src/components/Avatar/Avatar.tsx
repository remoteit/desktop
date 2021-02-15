import md5 from 'md5'
import React from 'react'
import fallbackImage from './user.png'
import { makeStyles, ButtonBase, Tooltip, Avatar as MuiAvatar } from '@material-ui/core'
import { colors } from '../../styling'

export interface Props {
  email?: string
  size?: number
  button?: boolean
  label?: true
}

export const Avatar: React.FC<Props> = ({ email, size = 40, button, label }) => {
  const css = useStyles()
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const style = { height: size, width: size, backgroundColor: colors.primary }

  return (
    <span className={label && css.label}>
      <MuiAvatar component="span" className={button ? css.avatar : ''} alt={email} style={style} src={url}>
        <img src={fallbackImage} alt={email} style={style} />
      </MuiAvatar>
      {label && email}
    </span>
  )
}

const useStyles = makeStyles({
  label: {
    display: 'flex',
    borderRadius: '50%',
  },
  avatar: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: colors.white,
    '&:hover': { borderColor: colors.primaryLight },
  },
})
