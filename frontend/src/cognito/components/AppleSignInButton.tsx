import React from 'react'
import browser from '../../services/Browser'
import { Stack, Button, ButtonProps } from '@mui/material'
import { Icon } from '../../components/Icon'

export type AppleSignInButtonProps = Omit<ButtonProps, 'children'>

export function AppleSignInButton(props: AppleSignInButtonProps) {
  if (!browser.isIOS) return null
  return (
    <Button
      {...props}
      variant="contained"
      sx={{ marginTop: 1, padding: 1, color: 'white.main', bgcolor: 'grayDarkest.main' }}
    >
      <Stack height={36} width={40} marginBottom="4px" justifyContent="center">
        <Icon name="apple" type="brands" fontSize={22} />
      </Stack>
      Sign in with Apple
    </Button>
  )
}
