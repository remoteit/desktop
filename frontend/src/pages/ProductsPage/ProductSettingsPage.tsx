import React, { useRef } from 'react'
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
import { ProductRegistrationCodes, ProductRevokedCodes } from '../../components/ProductRegistrationCodes'
import { getProductModel } from '../../selectors/products'
import { selectActiveAccountId } from '../../selectors/accounts'
import { dispatch } from '../../store'
import { useReadEffect } from '../../hooks/useReadAgain'

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
  useReadEffect(
    again => {
      if (!productId) return
      // Read as another sign-in now: the product is read whole again, as when the page was opened.
      if (again) fetched.current = undefined
      if (fetched.current !== productId) {
        fetched.current = productId
        dispatch.products.fetchSingle(productId)
      } else if (product && !detailed) {
        dispatch.products.refreshCredentials({ productId, accountId })
      }
    },
    [productId, product]
  )

  if (!product) {
    return (
      <Container gutterBottom>
        <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
          {t('productPage.productNotFound', 'Product not found')}
        </Typography>
      </Container>
    )
  }

  return (
    <ProductHeaderMenu product={product} title={t('productSettingsPage.title', 'Join keys and settings')}>
      <>
        {product.registrationWarning && (
          <Gutters>
            <Notice severity="warning" fullWidth>
              <strong>{t('productSettingsPage.warningTitle', 'Move this product to join keys')}</strong>
              <em>{product.registrationWarning}</em>
            </Notice>
          </Gutters>
        )}

        {detailed && (
          <>
            <ProductJoinKeys product={product} />
            <ProductOneTimeCodes product={product} />
          </>
        )}

        {product.registrationCode && (
          <Box sx={{ marginTop: detailed ? 2 : 0 }}>
            <Typography variant="subtitle1">
              {registrationCommand
                ? t('productSettingsPage.registrationCommand', 'Older registration command')
                : t('productSettingsPage.registrationCode', 'Older registration code')}
            </Typography>
            <Gutters top={null}>
              <Typography variant="caption" component="p" gutterBottom>
                {registrationCommand
                  ? t(
                      'productSettingsPage.registrationCommandHelp',
                      'Devices installed with this command join this product.'
                    )
                  : t(
                      'productSettingsPage.registrationCodeHelp',
                      'Devices installed with this code join this product.'
                    )}
              </Typography>
              <CopyCodeBlock
                value={registrationCommand || product.registrationCode}
                code={registrationCommand ? product.registrationCode : undefined}
              />
            </Gutters>
          </Box>
        )}

        {!!product.registrationCodes?.length && <ProductRegistrationCodes product={product} />}

        <ProductLifecycle product={product} />

        <ProductMaxDevices product={product} />
      </>
      <ProductRevokedCodes product={product} />
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="subtitle1">{t('productSettingsPage.details', 'Details')}</Typography>
        <Gutters top={null}>
          <DataDisplay product={product} attributes={productDetailAttributes} />
        </Gutters>
      </Box>
    </ProductHeaderMenu>
  )
}
