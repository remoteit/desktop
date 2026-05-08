import md5 from 'md5'
import React, { useMemo } from 'react'
import { createColor } from '../../helpers/uiHelper'
import { labelLookup } from '../../models/labels'
import { Avatar as MuiAvatar, Box, Tooltip } from '@mui/material'
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
  marginRight?: number
  children?: React.ReactNode
}

export const Avatar: React.FC<Props> = React.memo(
  ({
    email,
    size = 36,
    title,
    button,
    inline,
    tooltip,
    active,
    border = 1,
    fallback,
    marginRight,
    children,
  }) => {
    const url = useMemo(
      () => `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`,
      [email, size]
    )
    const color = useMemo(() => createColor(email), [email])
    fallback = (fallback || email || '?').substring(0, 1).toUpperCase()

    let Element = (
      <>
        <MuiAvatar
          alt={email}
          src={url}
          sx={theme => ({
            color: theme.palette.alwaysWhite.main,
            fontSize: size * 0.625,
            height: size,
            width: size,
            verticalAlign: 'middle',
            display: 'inline-flex',
            fontFamily: 'Roboto Mono',
            backgroundColor: labelLookup[color].color,
            border: `${border}px solid ${theme.palette.white.main}`,
            marginRight: inline ? `${spacing.sm}px` : marginRight,
          })}
        >
          <div>{fallback}</div>
        </MuiAvatar>
        {children}
      </>
    )

    if (button)
      Element = (
        <Box
          component="span"
          sx={theme => ({
            backgroundColor: active ? undefined : theme.palette.white.main,
            borderRadius: '50%',
            padding: `${border}px`,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: active ? theme.palette.primary.main : theme.palette.grayLighter.main,
            cursor: 'pointer',
            position: 'relative',
            color: theme.palette.primaryLight.main,
            boxShadow: active ? '0 0 10px' : undefined,
            '&:hover': {
              borderColor: active ? theme.palette.grayDark.main : theme.palette.primary.main,
              color: theme.palette.gray.main,
            },
          })}
        >
          {Element}
        </Box>
      )

    return tooltip ? (
      <Tooltip title={title || email || 'deleted'} placement="right" enterDelay={800} arrow>
        {Element}
      </Tooltip>
    ) : (
      Element
    )
  }
)
