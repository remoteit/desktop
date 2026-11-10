import React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ProductHeaderMenu } from '../../components/ProductHeaderMenu'
import { ProductSyncLevel } from '../../components/ProductSyncLevel'
import { ProductPolicySettings } from '../../components/ProductPolicySettings'
import { ProductGrants } from '../../components/ProductGrants'
import { ProductDevices } from '../../components/ProductDevices'
import { useProductPolicy } from '../../hooks/useProductPolicy'
import { getProductModel } from '../../selectors/products'
import { selectActiveAccountId } from '../../selectors/accounts'
import { selectPermissions } from '../../selectors/organizations'
import { dispatch } from '../../store'

/* A product's policy (graphql-api docs/PROXY-GROUPS.md §11, wave 4), for its Control Link devices: its sync level,
   the settings it sets, what it grants — networks, proxies; its tags are on its page — and the devices that
   belong to it. Its managers change them; a grant changed reads the product's registration warning again, as one with
   grants is warned of while it registers with reusable codes. Nothing where the API has no product policy. */
export const ProductPolicyPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const accountId = useSelector(selectActiveAccountId)
  const manage = useSelector(selectPermissions).includes('ADMIN')
  const { served, policy, reload } = useProductPolicy(productId)

  if (!product) return <LoadingMessage />

  if (served && !served.product)
    return (
      <Container gutterBottom>
        <Typography variant="body2" color="textSecondary">
          {t('productPolicyPage.unsupported', 'Product policy is not available here.')}
        </Typography>
      </Container>
    )

  const changed = async () => {
    await reload()
    dispatch.products.refreshCredentials({ productId, accountId })
  }

  return (
    <ProductHeaderMenu product={product}>
      <Gutters>
        {!served || policy === undefined ? (
          <LoadingMessage message={t('productPolicyPage.loading', 'Loading its policy...')} />
        ) : !policy ? (
          <Typography variant="body2" color="textSecondary">
            {t('productPolicyPage.failed', 'Its policy could not be read.')}
          </Typography>
        ) : (
          <>
            <ProductSyncLevel
              productId={product.id}
              name={product.name}
              sync={policy.sync}
              manage={manage}
              onChanged={changed}
            />
            {policy.settings && (
              <ProductPolicySettings
                productId={product.id}
                settings={policy.settings}
                manage={manage}
                onChanged={changed}
              />
            )}
            <ProductGrants
              productId={product.id}
              accountId={accountId}
              name={product.name}
              served={served}
              networks={policy.networks}
              manage={manage}
              registrationWarning={product.registrationWarning}
              onChanged={changed}
            />
            {policy.devices && <ProductDevices devices={policy.devices} />}
          </>
        )}
      </Gutters>
    </ProductHeaderMenu>
  )
}
