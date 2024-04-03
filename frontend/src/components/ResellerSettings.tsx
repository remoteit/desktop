import React from 'react'
import { Dispatch } from '../store'
import { Stack, List, ListSubheader, Paper } from '@mui/material'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ResellerLogo } from './ResellerLogo'
import { useDispatch } from 'react-redux'
import { lightColors, darkColors, radius } from '../styling'

export const ResellerSettings: React.FC<{ reseller?: IReseller | null }> = ({ reseller }) => {
  const dispatch = useDispatch<Dispatch>()

  if (!reseller) return null

  return (
    <List>
      <ListSubheader>Reseller</ListSubheader>
      <InlineTextFieldSetting
        icon="at"
        value={reseller.logoUrl}
        label="Logo URL"
        resetValue={reseller.logoUrl}
        onSave={value => dispatch.organization.setReseller({ logoUrl: value.toString() })}
      />
      {reseller.logoUrl && (
        <Stack
          marginLeft={9}
          marginRight={4}
          marginY={2}
          maxWidth={600}
          alignItems="center"
          flexDirection="row"
          overflow="hidden"
          borderRadius={radius.lg + 'px'}
        >
          <Paper elevation={0} square sx={{ bgcolor: lightColors.grayLighter, flexGrow: 1, textAlign: 'center' }}>
            <ResellerLogo reseller={reseller} />
          </Paper>
          <Paper elevation={0} square sx={{ bgcolor: darkColors.grayLighter, flexGrow: 1, textAlign: 'center' }}>
            <ResellerLogo reseller={reseller} />
          </Paper>
        </Stack>
      )}
    </List>
  )
}
