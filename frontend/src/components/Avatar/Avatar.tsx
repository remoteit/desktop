import md5 from 'md5'
import React from 'react'
import seedRandom from 'seedrandom'
import { labelLookup } from '../../models/labels'
import { makeStyles, Avatar as MuiAvatar, Tooltip } from '@material-ui/core'
import { spacing } from '../../styling'

export interface Props {
  email: string
  size?: number
  button?: boolean
  tooltip?: boolean
  inline?: boolean
}

export const Avatar: React.FC<Props> = ({ email, size = 40, button, inline, tooltip, children }) => {
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const color = Math.ceil(seedRandom(email || '')() * 12)
  const css = useStyles({ size, color, button, inline })

  const Element = (
    <>
      <MuiAvatar className={css.avatar} alt={email} src={url}>
        <div>{email.substring(0, 1).toUpperCase()}</div>
      </MuiAvatar>
      {children}
    </>
  )

  return tooltip ? (
    <Tooltip title={email} arrow>
      {Element}
    </Tooltip>
  ) : (
    Element
  )
}

const useStyles = makeStyles(({ palette }) => ({
  avatar: ({ size, color, button, inline }: { size: number; color: number; button?: boolean; inline?: boolean }) => ({
    color: palette.white.main,
    fontSize: size * 0.625,
    height: size,
    width: size,
    verticalAlign: 'middle',
    display: 'inline-flex',
    fontFamily: 'Roboto Mono',
    backgroundColor: labelLookup[color].color,
    borderWidth: button ? 3 : 1,
    borderStyle: 'solid',
    borderColor: palette.white.main,
    marginRight: inline ? spacing.sm : 0,
    '&:hover': { borderColor: button ? palette.primaryLight.main : undefined },
  }),
}))
