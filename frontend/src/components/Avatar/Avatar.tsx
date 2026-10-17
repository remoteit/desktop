import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import React, { useEffect, useMemo, useState } from 'react'
import { createColor } from '../../helpers/uiHelper'
import { httpsOnly } from '../../helpers/utilHelper'
import { labelLookup } from '../../models/labels'
import { useAccountPicture } from '../../hooks/useAccountPicture'
import { useUserPicture } from '../../hooks/useUserPicture'
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

/* The first of `urls` that loads, and nothing until one has: MUI's Avatar shows a blank <img> while its
   src loads, so a load that never errors (iOS, a blocked redirect) would hide the initial for good. */
function useFirstLoaded(urls: string[]) {
  const [loaded, setLoaded] = useState<{ urls: string[]; url: string }>()

  useEffect(() => {
    let active = true
    const load = (index: number) => {
      if (index >= urls.length) return
      const image = new Image()
      image.onload = () => active && setLoaded({ urls, url: urls[index] })
      image.onerror = () => active && load(index + 1)
      image.src = urls[index]
    }
    load(0)
    return () => {
      active = false
    }
  }, [urls])

  return loaded?.urls === urls ? loaded.url : undefined
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
    const signedIn = useAccountPicture(email)
    const known = useUserPicture(email)
    const urls = useMemo(() => {
      const hash = bytesToHex(sha256(utf8ToBytes((email || '').trim().toLowerCase())))
      const gravatar = `https://www.gravatar.com/avatar/${hash}?s=${size * 2}&d=404`
      return [...new Set([signedIn, httpsOnly(picture), httpsOnly(known), gravatar])].filter(
        (url): url is string => !!url
      )
    }, [email, size, picture, signedIn, known])
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
