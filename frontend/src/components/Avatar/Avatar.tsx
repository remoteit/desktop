import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import React, { useEffect, useMemo, useState } from 'react'
import { createColor } from '../../helpers/uiHelper'
import { httpsOnly } from '../../helpers/utilHelper'
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
  picture?: string
  children?: React.ReactNode
}

/* MUI's Avatar takes one src and falls to its children when that fails, so only the earlier URLs
   are checked here. Its img onError can't step on: MUI unmounts that img when its own preload errors. */
function useFirstLoaded(urls: string[]) {
  const [failed, setFailed] = useState<string[]>([])
  const [src, ...rest] = urls.filter(url => !failed.includes(url))
  const hasNext = rest.length > 0

  useEffect(() => {
    if (!src || !hasNext) return
    const image = new Image()
    image.onerror = () => setFailed(f => [...f, src])
    image.src = src
  }, [src, hasNext])

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
    picture,
    children,
  }) => {
    const urls = useMemo(() => {
      const signIn = httpsOnly(picture) ?? oidcPicture(email)
      const hash = bytesToHex(sha256(utf8ToBytes((email || '').trim().toLowerCase())))
      const gravatar = `https://www.gravatar.com/avatar/${hash}?s=${size * 2}&d=force-fail`
      return signIn ? [signIn, gravatar] : [gravatar]
    }, [email, size, picture])
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
