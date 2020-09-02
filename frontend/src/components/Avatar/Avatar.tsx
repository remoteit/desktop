import md5 from 'md5'
import React from 'react'
import fallbackImage from './user.png'
import { makeStyles, ButtonBase, Tooltip, Avatar as MuiAvatar } from '@material-ui/core'
import { colors } from '../../styling'

export interface Props {
  email?: string
}

const SIZE = 40

export const Avatar: React.FC<Props> = ({ email }) => {
  const css = useStyles()
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${SIZE * 2}&d=force-fail`

  return (
    <Tooltip title={`Account (${email})`} placement="left">
      <ButtonBase onClick={() => window.open('https://app.remote.it/#account')}>
        <MuiAvatar className={css.avatar} src={url}>
          <img className={css.avatar} src={fallbackImage} />
        </MuiAvatar>
      </ButtonBase>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  avatar: {
    borderRadius: '50%',
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: colors.white,
    height: SIZE,
    width: SIZE,
    backgroundColor: colors.primary,
    '&:hover': { borderColor: colors.primaryLight },
  },
})
