import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../../components/ContactSelector'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { ProductHeaderMenu } from '../../components/ProductHeaderMenu'
import { dispatch, State } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductTransferPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const { contacts = [], transferring } = useSelector((state: State) => ({
    contacts: state.contacts.all,
    transferring: state.ui.transferring,
  }))
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  
  const [open, setOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | undefined>()

  const handleChange = (emails: string[]) => {
    setSelected(undefined)
    if (emails.length > 0) {
      setSelected(emails[0])
    }
  }

  const onCancel = () => history.push(`/products/${productId}`)
  
  const onTransfer = async () => {
    if (productId && selected) {
      const success = await dispatch.products.transferProduct({ productId, email: selected })
      if (success) {
        history.push('/products')
      }
    }
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productTransferPage.notFound', 'Product not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <ProductHeaderMenu product={product}>
      <Gutters size="md" bottom={null}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {t('productTransferPage.title', 'Transfer Product')}
        </Typography>
        <ContactSelector contacts={contacts} selected={selected ? [selected] : []} onSelect={handleChange} isMulti={false} />
      </Gutters>
      <Gutters>
        <Typography variant="body2" gutterBottom>
          {t('productTransferPage.transferringTo', {
            name: product.name,
            defaultValue: 'You are transferring "{{name}}" to a new owner.',
          })}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t(
            'productTransferPage.transferDescription',
            'Product transfer typically takes a few seconds to complete. The new owner will gain full access to the product and all its services.'
          )}
        </Typography>
      </Gutters>
      <Gutters top="xl">
        <Button color="primary" onClick={() => setOpen(true)} disabled={!selected || transferring} variant="contained">
          {transferring ? t('productTransferPage.transferring', 'Transferring...') : t('productTransferPage.transfer', 'Transfer')}
        </Button>
        <Button disabled={transferring} onClick={onCancel}>
          {t('productTransferPage.cancel', 'Cancel')}
        </Button>
      </Gutters>
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          onTransfer()
        }}
        onDeny={() => setOpen(false)}
        color="error"
        title={t('common.areYouSure', 'Are you sure?')}
        action={t('productTransferPage.transfer', 'Transfer')}
      >
        <Notice severity="error" gutterBottom fullWidth>
          {t('productTransferPage.loseAccessWarning', 'You will lose all access and control of this product upon transfer.')}
        </Notice>
        <Typography variant="body2">
          {t('productTransferPage.confirmPrefix', 'You are about to transfer ownership of')} <b>{product.name}</b>{' '}
          {t('productTransferPage.confirmMiddle', 'and all of its services to')}
          <b> {selected}</b>.
        </Typography>
      </Confirm>
    </ProductHeaderMenu>
  )
}
