import md5 from 'md5'
import React from 'react'
import fallbackImage from './user.png'
import { makeStyles, Avatar as MuiAvatar, Tooltip } from '@material-ui/core'

export interface Props {
  email: string
  size?: number
  button?: boolean
  label?: boolean
  tooltip?: boolean
}

export const Avatar: React.FC<Props> = ({ email, size = 40, button, label, tooltip }) => {
  const css = useStyles(size)()
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const style = { height: size, width: size }

  const Element = (
    <span className={label ? css.label : ''}>
      <MuiAvatar
        component="span"
        className={css.avatar + ' ' + (button ? css.button : '')}
        alt={email}
        style={style}
        src={url}
      >
        <img src={fallbackImage} alt={email} className={css.img} style={style} />
      </MuiAvatar>
      {label && email}
    </span>
  )

  return tooltip ? (
    <Tooltip title={email} arrow>
      {Element}
    </Tooltip>
  ) : (
    Element
  )
}

const useStyles = size =>
  makeStyles(({ palette }) => ({
    label: {
      display: 'inline-flex',
      borderRadius: '50%',
    },
    avatar: { display: 'inline-block', marginRight: 1 },
    button: {
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: palette.white.main,
      '&:hover': { borderColor: palette.primaryLight.main },
      backgroundColor: `${palette.primary.main} !important`,
    },
    img: {
      backgroundColor: `${palette.primary.main} !important`,
    },
  }))
