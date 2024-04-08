import React, { useState, useEffect } from 'react'
import { Box, BoxProps } from '@mui/material'

type Props = BoxProps & {
  reseller?: IResellerRef | null
  size?: 'small' | 'medium'
}

const calculateDimensions = (width: number, height: number, maxArea: number) => {
  const aspectRatio = width / height
  const newHeight = Math.sqrt(maxArea / aspectRatio)
  const newWidth = aspectRatio * newHeight
  return { width: newWidth, height: newHeight }
}

export const ResellerLogo: React.FC<Props> = ({ reseller, size = 'medium', children, ...props }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const maxArea = size === 'small' ? 2400 : 6400

  useEffect(() => {
    if (reseller?.logoUrl) {
      const img = new Image()
      img.onload = () => setDimensions(calculateDimensions(img.width, img.height, maxArea))
      img.src = reseller.logoUrl
    }
  }, [reseller?.logoUrl, size])

  if (!reseller?.logoUrl || !dimensions) return null

  return (
    <>
      <Box marginX={3} marginY={2} {...props}>
        <img
          src={reseller.logoUrl}
          alt="Reseller logo"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        />
      </Box>
      {children}
    </>
  )
}

/* 
Test Logos
https://downloads.remote.it/organizations/remoteit.svg
https://upload.wikimedia.org/wikipedia/commons/3/34/Levis-logo.svg
https://www.freepnglogos.com/uploads/google-logo-png/file-google-logo-svg-wikimedia-commons-23.png
https://cdn.worldvectorlogo.com/logos/british-telecom.svg
https://www.flanders-china.be/storage/137/vito-nv-vector-logo.svg
*/
