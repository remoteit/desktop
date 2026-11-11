import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { CopyCodeBlock } from '../../components/CopyCodeBlock'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { Notice } from '../../components/Notice'
import { ProductHeaderMenu } from '../../components/ProductHeaderMenu'
import { productDetailAttributes } from '../../components/ProductAttributes'
import { ProductJoinKeys } from '../../components/ProductJoinKeys'
import { ProductLifecycle } from '../../components/ProductLifecycle'
import { ProductMaxDevices } from '../../components/ProductMaxDevices'
import { ProductOneTimeCodes } from '../../components/ProductOneTimeCodes'
import { ProductRegistrationCodes } from '../../components/ProductRegistrationCodes'
import { getProductModel } from '../../selectors/products'
import { selectActiveAccountId } from '../../selectors/accounts'
import { dispatch } from '../../store'

export const ProductSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  const registrationCommand = product?.registrationCommand

  // Read once per product, and again whenever the product is replaced by one without its credentials: the list query
  // and the edit mutations do not carry them. That re-read merges only the credential fields into the store as it is
  // then (refreshCredentials), so it cannot undo a change made meanwhile; it changes nothing once the fields agree, so a
  // read that keeps failing is not retried in a loop.
  const accountId = useSelector(selectActiveAccountId)
  const detailed = product?.joinKeys !== undefined
  const fetched = useRef<string>()
  useEffect(() => {
    if (!productId) return
    if (fetched.current !== productId) {
      fetched.current = productId
      dispatch.products.fetchSingle(productId)
    } else if (product && !detailed) {
      dispatch.products.refreshCredentials({ productId, accountId })
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

  // Join keys and one-time codes first: they are how a product registers devices. Reusable codes follow for the
  // products that still have them; a new product has none, and so no registration command. Then whether its devices are
  // persistent or ephemeral, read with the credentials, and how many it may hold, read on its own where the API has it.
  return (
    <ProductHeaderMenu product={product}>
      <Gutters>
        {product.registrationWarning && (
          <Notice severity="warning" fullWidth gutterBottom>
            <strong>{t('productSettingsPage.warningTitle', 'Move this product to join keys')}</strong>
            <em>{product.registrationWarning}</em>
          </Notice>
        )}

        {detailed && (
          <>
            <ProductJoinKeys product={product} />
            <ProductOneTimeCodes product={product} />
          </>
        )}

        {product.registrationCode && (
          <Box sx={{ marginTop: detailed ? 3 : 0 }}>
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
          </Box>
        )}

        {!!product.registrationCodes?.length && <ProductRegistrationCodes product={product} />}

        <ProductLifecycle product={product} />

        <ProductMaxDevices product={product} />

        <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ marginTop: 3 }}>
          Details
        </Typography>
        <DataDisplay product={product} attributes={productDetailAttributes} />
      </Gutters>
    </ProductHeaderMenu>
  )
}
