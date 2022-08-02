import React from 'react'

export type CoBrandingLogoProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> & {
  email?: string
  hostName?: string
  fallback?: JSX.Element
  onLoaded?: () => void
}

export function CoBrandingLogo({
  fallback,
  hostName = window.location.hostname,
  onLoaded,
  ...props
}: CoBrandingLogoProps): JSX.Element {
  try {
    return <img {...props} src={require(`../../assets/img/logos/${hostName}/logo.png`)} style={{ width: '100%' }} />
  } catch (error) {
    if (fallback) return fallback
    return <></>
  }
}
