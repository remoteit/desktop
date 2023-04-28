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
  border?: number
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
  border = 1,
  fallback,
  children,
}) => {
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const color = createColor(email)
  const css = useStyles({ size, color, button, inline, active, border })
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

type StyleProps = { button?: boolean; inline?: boolean; active?: boolean; size: number; color: number; border: number }

const useStyles = makeStyles(({ palette }) => ({
  avatar: ({ size, color, inline, border }: StyleProps) => ({
    color: palette.alwaysWhite.main,
    fontSize: size * 0.625,
    height: size,
    width: size,
    verticalAlign: 'middle',
    display: 'inline-flex',
    fontFamily: 'Roboto Mono',
    backgroundColor: labelLookup[color].color,
    border: `${border}px solid ${palette.white.main}`,
    marginRight: inline ? spacing.sm : 0,
  }),
  button: ({ active, border }: StyleProps) => ({
    backgroundColor: active ? undefined : palette.white.main,
    borderRadius: '50%',
    padding: border,
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
