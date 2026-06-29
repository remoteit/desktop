import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMediaQuery, Typography, Box, Stack, Divider, Theme, Chip, Button } from '@mui/material'
import { AddPlatformServices } from '../components/AddPlatformServices'
import { selectPermissions } from '../selectors/organizations'
import { AddPlatformTags } from '../components/AddPlatformTags'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { Notice } from '../components/Notice'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { dispatch } from '../store'

export const PlatformAddPage: React.FC = () => {
  let { platform = '', redirect } = useParams<{ platform?: string; redirect?: string }>()
  const history = useHistory()
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const permissions = useSelector(selectPermissions)
  const [platformTags, setPlatformTags] = useState<string[]>([])
  const [serviceTypes, setServiceTypes] = useState<number[]>(defaultServices)
  const [oneTimeUse, setOneTimeUse] = useState(false)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const xs = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  const handleMakeProduct = async () => {
    const platformCode = platforms.findType(platformObj.id)
    if (!platformCode || serviceTypes.length === 0) return

    setCreatingProduct(true)
    const product = await dispatch.products.createFromRegistration({
      platform: platformCode,
      tags: platformTags,
      services: serviceTypes.map(type => ({ application: type })),
    })
    setCreatingProduct(false)
    if (product) history.push(`/products/${product.id}/details`)
  }

  return (
    <Body center>
      <Stack
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={{ xs: 'center', md: 'left' }}
        alignItems={{ xs: 'left', md: 'top' }}
        paddingX={{ xs: 3, md: 0 }}
        paddingBottom={5}
        flexWrap="wrap"
      >
        <Stack
          maxWidth={{ md: 130 }}
          marginTop={{ xs: 0, md: 2 }}
          marginRight={{ md: 3 }}
          marginBottom={{ xs: 3, md: 0 }}
          flexDirection={{ xs: 'row', md: 'column' }}
        >
          <Icon name={platform} fontSize={100} inlineLeft={xs} platformIcon />
          {platformObj.installation?.command && permissions.includes('MANAGE') && (
            <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              {!xs && <Divider sx={{ marginTop: 4, width: '80%' }} />}
              <AddPlatformServices
                types={serviceTypes}
                onChange={type => setServiceTypes(type)}
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              />
              <AddPlatformTags
                tags={platformTags}
                onChange={tags => setPlatformTags(tags)}
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              />
              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} marginTop={2} spacing={1} width="100%">
                <Chip
                  label={oneTimeUse ? 'ONE-TIME USE' : 'MULTI USE'}
                  size="small"
                  color={oneTimeUse ? 'primary' : 'default'}
                  variant={oneTimeUse ? 'filled' : 'outlined'}
                  onClick={() => setOneTimeUse(!oneTimeUse)}
                  sx={{
                    fontWeight: 500,
                    letterSpacing: 1,
                    color: oneTimeUse ? undefined : 'grayDarker.main',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    minWidth: 130,
                    '& .MuiChip-label': { width: '100%', textAlign: 'center', px: 0 },
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={creatingProduct || serviceTypes.length === 0}
                  onClick={handleMakeProduct}
                  sx={{
                    fontWeight: 500,
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
                    width: '100%',
                    minWidth: 130,
                  }}
                >
                  MAKE PRODUCT
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
        <Stack
          sx={{
            alignItems: xs ? 'left' : undefined,
            borderLeft: xs ? undefined : '1px solid',
            borderLeftColor: 'grayLighter.main',
            paddingLeft: xs ? 0 : 4.5,
            paddingRight: xs ? 0 : 0,
            paddingTop: 2.25,
            paddingBottom: 2.25,
            maxWidth: 650,
            width: xs ? '100%' : 'auto',
            '& .MuiAvatar-root': { marginTop: 0.375 },
            '& > .MuiTypography-body2': { marginBottom: 0.75 },
          }}
        >
          {!permissions.includes('MANAGE') ? (
            <Box>
              <Notice>You must have the register permission to add a device to this organization.</Notice>
            </Box>
          ) : platformObj.override ? (
            <platformObj.override platform={platformObj} tags={platformTags} serviceTypes={serviceTypes} oneTimeUse={oneTimeUse} />
          ) : platformObj.installation?.command && !platformObj.installation?.download ? (
            <AddDevice platform={platformObj} tags={platformTags} serviceTypes={serviceTypes} redirect={redirect} oneTimeUse={oneTimeUse} />
          ) : (
            <>
              <AddDownload platform={platformObj} />
              {platformObj.hasScreenView && (
                <>
                  <Typography variant="body2" color="textSecondary" paddingBottom={1}>
                    Or use this registration code to manually claim the ScreenView app.
                  </Typography>
                  <AddDevice
                    platform={platformObj}
                    tags={platformTags}
                    serviceTypes={serviceTypes}
                    redirect={redirect}
                    oneTimeUse={oneTimeUse}
                    minimal
                  />
                </>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Body>
  )
}
