import React from 'react'
import { Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { Container } from './Container'
import { LoadingMessage } from './LoadingMessage'
import { Title } from './Title'
import { Gutters } from './Gutters'

type Props = {
  product?: IDeviceProduct
  title: string
  header?: React.ReactNode
  children?: React.ReactNode
}

export const ProductHeaderMenu: React.FC<Props> = ({ product, title, header, children }) => {
  if (!product) return <LoadingMessage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{title}</Title>
          </Typography>
          <Gutters top={null}>
            <Typography variant="body2" color="textSecondary" noWrap>
              {product.name || 'Unknown'}
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
