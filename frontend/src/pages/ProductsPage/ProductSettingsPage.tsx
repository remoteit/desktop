import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { CopyCodeBlock } from '../../components/CopyCodeBlock'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { ProductHeaderMenu } from '../../components/ProductHeaderMenu'
import { productDetailAttributes } from '../../components/ProductAttributes'
import { ProductRegistrationCodes } from '../../components/ProductRegistrationCodes'
import { getProductModel } from '../../selectors/products'
import { selectActiveAccountId } from '../../selectors/accounts'
import { dispatch } from '../../store'

export const ProductSettingsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  const registrationCommand = product?.registrationCommand

  // Read once per product, and again whenever the product is replaced by one without its codes: the list query and the
  // edit mutations do not carry them. That re-read merges only the code fields into the store as it is then
  // (refreshCodes), so it cannot undo a change made meanwhile; it changes nothing once the fields agree, so a read that
  // keeps failing is not retried in a loop.
  const accountId = useSelector(selectActiveAccountId)
  const detailed = product?.registrationCodes !== undefined
  const fetched = useRef<string>()
  useEffect(() => {
    if (!productId) return
    if (fetched.current !== productId) {
      fetched.current = productId
      dispatch.products.fetchSingle(productId)
    } else if (product && !detailed) {
      dispatch.products.refreshCodes({ productId, accountId })
    }
  }, [productId, product])

  if (!product) {
    return (
      <Container gutterBottom>
        <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
          Product not found
        </Typography>
      </Container>
    )
  }

  return (
    <ProductHeaderMenu product={product}>
      <Gutters>
        {product.registrationCode && (
          <>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              {registrationCommand ? 'Registration Command' : 'Registration Code'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ marginBottom: 2 }}>
              {registrationCommand
                ? 'Use this command to register devices with this product configuration:'
                : 'Use this registration code to register devices with this product configuration:'}
            </Typography>
            <CopyCodeBlock
              value={registrationCommand || product.registrationCode}
              code={registrationCommand ? product.registrationCode : undefined}
            />
          </>
        )}

        {!!product.registrationCodes?.length && <ProductRegistrationCodes product={product} />}

        <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ marginTop: 3 }}>
          Details
        </Typography>
        <DataDisplay product={product} attributes={productDetailAttributes} />
      </Gutters>
    </ProductHeaderMenu>
  )
}
