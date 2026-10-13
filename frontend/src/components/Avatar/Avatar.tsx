import md5 from 'md5'
import React, { useEffect, useMemo, useState } from 'react'
import { createColor } from '../../helpers/uiHelper'
import { labelLookup } from '../../models/labels'
import { oidcPicture } from '../../services/oidc'
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

/* MUI's Avatar takes one src. Its img onError can't step to the next one reliably: MUI unmounts
   that img as soon as its own preload of the same src errors. */
function useFirstLoaded(urls: string[]) {
  const key = urls.join(' ')
  const [failed, setFailed] = useState({ key, count: 0 })
  const count = failed.key === key ? failed.count : 0
  const src = urls[count]

  useEffect(() => {
    if (!src) return
    let active = true
    const image = new Image()
    image.onerror = () => active && setFailed({ key, count: count + 1 })
    image.src = src
    return () => {
      active = false
    }
  }, [key, count, src])

  return src
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
    const urls = useMemo(() => {
      const picture = oidcPicture(email)
      const gravatar = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
      return picture ? [picture, gravatar] : [gravatar]
    }, [email, size])
    const url = useFirstLoaded(urls)
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
            marginRight: inline ? `${spacing.sm}px` : marginRight ? `${marginRight}px` : undefined,
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
