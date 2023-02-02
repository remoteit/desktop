import md5 from 'md5'
import React from 'react'
import classnames from 'classnames'
import { createColor } from '../../helpers/uiHelper'
import { labelLookup } from '../../models/labels'
import { makeStyles } from '@mui/styles'
import { Avatar as MuiAvatar, Tooltip } from '@mui/material'
import { spacing } from '../../styling'

export interface Props {
  email?: string
  size?: number
  button?: boolean
  tooltip?: boolean
  inline?: boolean
  title?: string
  active?: boolean
  fallback?: string
  children?: React.ReactNode
}

export const Avatar: React.FC<Props> = ({
  email,
  size = 36,
  title,
  button,
  inline,
  tooltip,
  active,
  fallback,
  children,
}) => {
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const color = createColor(email)
  const css = useStyles({ size, color, button, inline, active })
  fallback = (fallback || email || '?').substring(0, 1).toUpperCase()

  let Element = (
    <>
      <MuiAvatar className={css.avatar} alt={email} src={url}>
        <div>{fallback}</div>
      </MuiAvatar>
      {children}
    </>
  )

  if (button) Element = <span className={classnames(button && css.button)}>{Element}</span>

  return tooltip ? (
    <Tooltip title={title || email || 'deleted'} placement="right" enterDelay={800} arrow>
      {Element}
    </Tooltip>
  ) : (
    Element
  )
}

type StyleProps = { button?: boolean; inline?: boolean; active?: boolean; size: number; color: number }

const useStyles = makeStyles(({ palette }) => ({
  avatar: ({ size, color, inline }: StyleProps) => ({
    color: palette.alwaysWhite.main,
    fontSize: size * 0.625,
    height: size,
    width: size,
    verticalAlign: 'middle',
    display: 'inline-flex',
    fontFamily: 'Roboto Mono',
    backgroundColor: labelLookup[color].color,
    border: `1px solid ${palette.white.main}`,
    marginRight: inline ? spacing.sm : 0,
  }),
  button: ({ active }: StyleProps) => ({
    backgroundColor: active ? undefined : palette.white.main,
    borderRadius: '50%',
    padding: 1,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: active ? palette.primary.main : palette.grayLighter.main,
    cursor: 'pointer',
    position: 'relative',
    color: palette.primaryLight.main,
    boxShadow: active ? '0 0 10px' : undefined,
    '&:hover': {
      borderColor: active ? palette.grayDark.main : palette.primary.main,
      color: palette.gray.main,
    },
  }),
}))
