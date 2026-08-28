import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Stack, ListItemIcon, Box } from '@mui/material'
import { AddPlatformServices } from './AddPlatformServices'
import { selectCanRegister } from '../selectors/organizations'
import { AddDevice } from './AddDevice'
import { platforms } from '../platforms'
import { Icon } from './Icon'

export const AddQuickPlatform: React.FC = () => {
  const platform = 'linux'
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const canRegister = useSelector(selectCanRegister)
  const [applicationTypes, setApplicationTypes] = useState<number[]>(defaultServices)

  useEffect(() => {
    setApplicationTypes(defaultServices)
  }, [platform])

  return (
    <Stack flexWrap={{ xs: 'wrap', md: 'nowrap' }} width="100%" flexDirection="row" marginBottom={3}>
      <Stack flexDirection="column" alignItems="flex-start" maxWidth={130} marginTop={3} paddingRight={2}>
        <ListItemIcon>
          <Icon name={platform} size="xxl" platformIcon fixedWidth />
        </ListItemIcon>
        {canRegister && (
          <AddPlatformServices types={applicationTypes} onChange={type => setApplicationTypes(type)} />
        )}
      </Stack>
      <Box paddingTop={2}>
        <AddDevice platform={platformObj} serviceTypes={applicationTypes} minimal />
      </Box>
    </Stack>
  )
}
