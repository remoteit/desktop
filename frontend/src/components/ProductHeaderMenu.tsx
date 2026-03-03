import React from 'react'
import { Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { Container } from './Container'
import { LoadingMessage } from './LoadingMessage'
import { Title } from './Title'
import { Gutters } from './Gutters'
import { ProductOptionMenu } from './ProductOptionMenu'

type Props = {
  product?: IDeviceProduct
  header?: React.ReactNode
  children?: React.ReactNode
}

export const ProductHeaderMenu: React.FC<Props> = ({ product, header, children }) => {
  if (!product) return <LoadingMessage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={
        <>
          <Typography variant="h1" sx={{ alignItems: 'center' }}>
            <Title>{product.name || 'Unknown'}</Title>
            <ProductOptionMenu product={product} />
          </Typography>
          <Gutters top={null}>
            <Typography variant="body2" color="textSecondary">
              {product.platform?.name || `Platform ${product.platform?.id}`}
            </Typography>
          </Gutters>
          {header}
        </>
      }
    >
      {children}
    </Container>
  )
}
