import { Box, BoxProps, IconButton, Typography } from '@mui/material'
import React, { ReactNode } from 'react'
import { colors, radius, BrandColor } from '../../styles/variables'
import { Icon } from '../Icon'

type AlertSize = 'sm' | 'md'
type AlertVariant = 'default' | 'inverted' | 'outlined'
type AlertType = 'success' | 'info' | 'warning' | 'danger' | 'muted'

export type AlertProps = BoxProps & {
  children: ReactNode
  variant?: AlertVariant
  onClose?: () => void
  size?: AlertSize
  stayOpen?: boolean
  timeout?: number
  type?: AlertType
  icon?: AlertType | string
}

export function Alert({
  children,
  icon,
  onClose,
  stayOpen,
  timeout,
  type = 'danger',
  variant = 'default',
  size = 'md',
  ...props
}: AlertProps): JSX.Element {
  const [visible, setVisible] = React.useState<boolean>(true)

  React.useEffect(() => {
    if (timeout) {
      setTimeout(() => {
        setVisible(false)
      }, timeout * 1000)
    }
  })

  function handleClose(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    e.preventDefault()
    setVisible(false)
    if (onClose) onClose()
  }

  if (!visible) return <></>

  // Use the given icon or default to the type of alert.
  let iconKey
  if (type === 'danger') iconKey = 'exclamation-triangle'
  if (type === 'warning') iconKey = 'exclamation-circle'
  if (type === 'success') iconKey = 'check'
  if (type === 'info') iconKey = 'info-circle'
  if (type === 'muted') iconKey = 'info-circle'
  if (icon) iconKey = icon
  if (!iconKey) iconKey = 'exclamation-cirlce'

  let base: BrandColor = type as any
  if (type === 'muted') base = 'gray'
  if (variant === 'inverted') base = (type + 'Lighter') as BrandColor

  // Set text color for all variants
  let color
  if (variant === 'default') color = colors.white
  if (variant === 'inverted') color = colors[base]
  if (variant === 'outlined') color = colors[base]

  // Set background color for all variants
  let bgcolor
  if (variant === 'default') bgcolor = colors[base]
  if (variant === 'inverted') bgcolor = colors.grayDarkest
  if (variant === 'outlined') bgcolor = 'transparent'

  const medium = size === 'md'
  const fontSize = size === 'md' ? 16 : 12

  return (
    <Box
      alignItems="center"
      bgcolor={bgcolor}
      border={variant === 'outlined' ? '1px solid' : '0px none'}
      borderColor={color}
      borderRadius={radius.sm}
      color={color}
      display="flex"
      fontSize={fontSize}
      pl={medium ? 3 : 2}
      pr={medium ? 2 : 1}
      {...props}
    >
      <Box mr={medium ? 2 : 1}>
        <Icon fixedWidth name={iconKey} />
      </Box>
      <Box flex={1} py={medium ? 2 : 1}>
        <Typography variant="body2">{children}</Typography>
      </Box>
      {!stayOpen && (
        <Box lineHeight={1} ml="auto" p={1}>
          <IconButton onClick={handleClose} size="small">
            <Box color={color} component="span">
              <Icon fixedWidth name="times" size={medium ? '1x' : 'xs'} />
            </Box>
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
