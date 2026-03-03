import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, List } from '@mui/material'
import { Icon } from '../../components/Icon'
import { CopyCodeBlock } from '../../components/CopyCodeBlock'
import { Body } from '../../components/Body'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { ProductHeaderMenu } from '../../components/ProductHeaderMenu'
import { productDetailAttributes } from '../../components/ProductAttributes'
import { ListItemSetting } from '../../components/ListItemSetting'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductSettingsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const [updating, setUpdating] = useState(false)

  const isLocked = product?.status === 'LOCKED'
  const registrationCommand = product?.registrationCommand

  const handleLockToggle = async () => {
    if (!product || isLocked) return
    setUpdating(true)
    await dispatch.products.updateSettings({
      id: product.id,
      input: { lock: true },
    })
    setUpdating(false)
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Product not found
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <ProductHeaderMenu product={product}>
      <List>
        <ListItemSetting
          icon="lock"
          label="Lock Product"
          subLabel={
            isLocked
              ? 'This product is locked and cannot be unlocked.'
              : 'Lock the product to enable bulk registration. Once locked, it cannot be unlocked.'
          }
          toggle={isLocked}
          disabled={updating || isLocked}
          onClick={handleLockToggle}
        />
      </List>
      <Gutters>
        {isLocked && product.registrationCode && (
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

        <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ marginTop: 3 }}>
          Details
        </Typography>
        <DataDisplay product={product} attributes={productDetailAttributes} />
      </Gutters>
    </ProductHeaderMenu>
  )
}
