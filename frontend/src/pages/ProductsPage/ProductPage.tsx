import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Box, Button, Divider, List, Stack, ListItemText, Typography } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { Confirm } from '../../components/Confirm'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ColorChip } from '../../components/ColorChip'
import { CopyCodeBlock } from '../../components/CopyCodeBlock'
import { CreateJoinKeyDialog } from '../../components/CreateJoinKeyDialog'
import { ProductIntakeChip } from '../../components/ProductIntakeChip'
import { ProductTagEditor } from '../../components/ProductTagEditor'
import { ProductPolicyLink } from '../../components/ProductPolicyLink'
import { useProductPolicy } from '../../hooks/useProductPolicy'
import { overviewOf } from '../../helpers/productStatus'
import { graphQLProductMaxDevices } from '../../services/productMaxDevices'
import { selectActiveAccountId } from '../../selectors/accounts'
import { selectPermissions } from '../../selectors/organizations'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'
import { fontSizes, spacing } from '../../styling'
import { Gutters } from '../../components/Gutters'
import { useReadEffect } from '../../hooks/useReadAgain'

const Section: React.FC<{ title: string; action?: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  action,
  children,
}) => (
  <Box component="section" sx={{ marginBottom: 2 }}>
    <Typography variant="subtitle1">
      <Title>{title}</Title>
      {action}
    </Typography>
    {children}
  </Box>
)

export const ProductPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const { all: products, fetching, initialized } = useSelector(getProductModel)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const accountId = useSelector(selectActiveAccountId)
  const product = products.find(p => p.id === productId)
  const { policy } = useProductPolicy(productId)
  const [counts, setCounts] = useState<{ devices: number | null; maxDevices: number | null }>()
  const [creatingKey, setCreatingKey] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useReadEffect(() => {
    if (productId) {
      dispatch.products.fetchSingle(productId)
    }
  }, [productId])

  useReadEffect(() => {
    dispatch.tags.fetchIfEmpty()
  }, [])

  useReadEffect(
    again => {
      if (!productId) return
      let current = true
      if (!again) setCounts(undefined)
      graphQLProductMaxDevices(productId, accountId).then(result => {
        if (!current) return
        if (result && result !== 'ERROR') setCounts({ devices: result.devicesCounted, maxDevices: result.maxDevices })
        else if (again) setCounts(undefined)
      })
      return () => {
        current = false
      }
    },
    [productId, accountId, product?.updated]
  )

  if (fetching && !initialized) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('productPage.loadingProduct', 'Loading product...')} />
      </Container>
    )
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productPage.productNotFound', 'Product not found')}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('productPage.productNotFoundHint', "The product may have been deleted or you don't have access to it.")}
          </Typography>
        </Body>
      </Container>
    )
  }

  const detailed = product.joinKeys !== undefined
  const keysInForce = product.joinKeys?.filter(key => key.inForce).length ?? 0
  const deviceCount = policy?.deviceCount ?? counts?.devices ?? null
  const platformName =
    product.platform?.name || t('productPage.platformId', { id: product.platform?.id, defaultValue: 'Platform {{id}}' })

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Gutters bottom="sm">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Icon platform={product.platform?.id} platformIcon size="xl" />
            <Box minWidth={0}>
              <Typography
                variant="h2"
                component="h1"
                sx={{ fontSize: fontSizes.xl, fontWeight: 500, letterSpacing: -0.2, overflowWrap: 'anywhere' }}
              >
                {product.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {deviceCount == null
                  ? platformName
                  : t('productPage.platformDevices', {
                      platform: platformName,
                      count: deviceCount,
                      defaultValue_one: '{{platform}} · {{count}} device',
                      defaultValue_other: '{{platform}} · {{count}} devices',
                    })}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} marginTop={1.5}>
            {detailed && <ProductIntakeChip overview={overviewOf(product, counts)} />}
            <ProductTagEditor product={product} />
          </Stack>
        </Gutters>
      }
    >
      <Section title={t('productPage.addDevices', 'Add devices')}>
        <Gutters top={null}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t(
              'productPage.addDevicesHelp',
              'Put a join key on each device you install. Every device that joins becomes a device of this product.'
            )}
          </Typography>
          {product.registrationCommand && product.registrationCode && (
            <CopyCodeBlock
              label={t('productPage.registrationCommand', 'Install command')}
              value={product.registrationCommand}
              code={product.registrationCode}
              sx={{ marginY: 1 }}
            />
          )}
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} marginTop={1}>
            <Button
              size="small"
              variant="contained"
              disabled={!admin}
              startIcon={<Icon name="key" />}
              onClick={() => setCreatingKey(true)}
            >
              {t('productPage.createJoinKey', 'Create join key')}
            </Button>
          </Stack>
          {detailed && (
            <Typography variant="caption" color="textSecondary" component="p" sx={{ marginTop: 1, textWrap: 'pretty' }}>
              {t('productPage.keysInForce', {
                count: keysInForce,
                defaultValue_zero: 'No join key is in force.',
                defaultValue_one: '{{count}} join key in force.',
                defaultValue_other: '{{count}} join keys in force.',
              })}{' '}
              {t('productPage.keyShownOnce', 'A key is shown only once, when you create it.')}
            </Typography>
          )}
        </Gutters>
      </Section>

      <Section
        title={t('productPage.services', 'Services')}
        action={
          <IconButton
            icon="plus"
            title={t('productPage.addService', 'Add service')}
            onClick={() => history.push(`/products/${product.id}/add`)}
            size="md"
          />
        }
      >
        {product.services.length === 0 ? (
          <Gutters top={null}>
            <Notice severity="info" fullWidth>
              {t('productPage.noServicesDefined', 'No services yet. Add the services each device of this product has.')}
            </Notice>
          </Gutters>
        ) : (
          <List disablePadding sx={{ '& .MuiListItem-root': { paddingRight: spacing.sm } }}>
            {product.services.map(service => (
              <ListItemLocation
                key={service.id}
                to={`/products/${product.id}/${service.id}`}
                match={`/products/${product.id}/${service.id}`}
                dense
                icon={service.type?.name === 'SSH' ? 'terminal' : 'port'}
                iconColor={service.enabled ? 'primary' : 'grayDark'}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ opacity: service.enabled ? 1 : 0.55 }}>
                      {service.name}
                    </Typography>
                  }
                />
                <ColorChip
                  size="small"
                  label={service.type?.name || t('productPage.unknown', 'Unknown')}
                  color="grayDark"
                  variant="text"
                />
              </ListItemLocation>
            ))}
          </List>
        )}
      </Section>

      <Section title={t('productPage.devices', 'Devices')}>
        {policy?.devices?.length ? (
          <List disablePadding>
            {policy.devices.map(device => (
              <ListItemLocation
                key={device.id}
                to={`/devices/${device.id}`}
                icon="hdd"
                iconColor={device.state === 'active' ? 'primary' : 'grayDark'}
                title={device.name}
                dense
              />
            ))}
            {deviceCount != null && deviceCount > policy.devices.length && (
              <Gutters top={null} bottom={null}>
                <Typography variant="caption" color="textSecondary">
                  {t('productDevices.more', {
                    count: deviceCount - policy.devices.length,
                    defaultValue: 'and {{count}} more',
                  })}
                </Typography>
              </Gutters>
            )}
          </List>
        ) : (
          <Gutters top={null}>
            <Typography variant="body2" color="textSecondary">
              {deviceCount
                ? t('productPage.deviceCount', {
                    count: deviceCount,
                    defaultValue_one: '{{count}} device belongs to this product.',
                    defaultValue_other: '{{count}} devices belong to this product.',
                  })
                : t('productPage.noDevices', 'No devices yet. Devices appear here once they join.')}
            </Typography>
          </Gutters>
        )}
      </Section>

      <Section title={t('productPage.settings', 'Settings')}>
        <List disablePadding>
          <ListItemLocation
            to={`/products/${product.id}/details`}
            match={[`/products/${product.id}/details`, `/products/${product.id}`]}
            exactMatch
            icon="key"
            title={t('productPage.keysAndLimits', 'Join keys, device limit and lifecycle')}
            dense
          />
          <ProductPolicyLink productId={product.id} />
        </List>
      </Section>

      <Divider sx={{ marginX: 4, marginBottom: 1 }} />
      <List disablePadding aria-label={t('productPage.ownership', 'Transfer or delete')}>
        <ListItemLocation
          to={`/products/${product.id}/transfer`}
          match={`/products/${product.id}/transfer`}
          icon="arrow-turn-down-right"
          title={t('productOptionMenu.transferProduct', 'Transfer product')}
          dense
        />
        <ListItemLocation
          icon="trash"
          iconColor={admin ? 'danger' : 'grayLight'}
          title={t('productOptionMenu.deleteProduct', 'Delete product')}
          disabled={!admin}
          dense
          onClick={() => setDeleting(true)}
        />
      </List>
      <Confirm
        open={deleting}
        color="error"
        title={t('productOptionMenu.deleteTitle', 'Delete product?')}
        action={t('productOptionMenu.deleteProduct', 'Delete product')}
        onDeny={() => setDeleting(false)}
        onConfirm={async () => {
          setDeleting(false)
          const success = await dispatch.products.delete(product.id)
          if (success) history.push('/products')
        }}
      >
        <Notice severity="error" gutterBottom fullWidth>
          {t('productOptionMenu.cannotBeUndone', 'This action cannot be undone.')}
        </Notice>
        <Typography variant="body2">
          {t('productOptionMenu.deleteConfirm', {
            name: product.name,
            defaultValue: 'Delete {{name}} and all its services permanently?',
          })}
        </Typography>
      </Confirm>
      {creatingKey && <CreateJoinKeyDialog product={product} onClose={() => setCreatingKey(false)} />}
    </Container>
  )
}
