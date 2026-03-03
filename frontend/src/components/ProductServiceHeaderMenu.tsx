import React from 'react'
import { Box, Typography } from '@mui/material'
import { IDeviceProduct, IProductService } from '../models/products'
import { Container } from './Container'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { Title } from './Title'

type Props = {
  product?: IDeviceProduct
  service?: IProductService
  children?: React.ReactNode
  locked?: boolean
  action?: React.ReactNode
}

export const ProductServiceHeaderMenu: React.FC<Props> = ({ product, service, children, locked, action }) => {
  if (!product || !service) return null

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1" sx={{ alignItems: 'center', width: '100%', gap: 1 }}>
            <Title>{service.name || 'Unknown service'}</Title>
            {action && (
              <Box marginLeft="auto" display="flex" alignItems="center">
                {action}
              </Box>
            )}
          </Typography>
          <Gutters top={null}>
            <Typography variant="body2" color="textSecondary">
              {service.type?.name || 'Unknown'} service template
            </Typography>
          </Gutters>
          {locked && (
            <Gutters top="sm" bottom={null}>
              <Notice severity="info" fullWidth>
                This product is locked. Services cannot be modified.
              </Notice>
            </Gutters>
          )}
        </>
      }
    >
      {children}
    </Container>
  )
}
