import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Button, Box } from '@mui/material'
import { ContactSelector } from '../../components/ContactSelector'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { Body } from '../../components/Body'
import { spacing } from '../../styling'
import { dispatch, State } from '../../store'
import { getProductModel } from '../../selectors/products'

type Props = {
  showBack?: boolean
}

export const ProductTransferPage: React.FC<Props> = ({ showBack = true }) => {
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

  const handleBack = () => {
    history.push(`/products/${productId}`)
  }

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
            Product not found
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          {showBack && (
            <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
              <IconButton
                icon="chevron-left"
                title="Back to Product"
                onClick={handleBack}
                size="md"
              />
            </Box>
          )}
          <Typography variant="h1">Transfer Product</Typography>
          <Gutters top={null}>
            <ContactSelector
              contacts={contacts}
              selected={selected ? [selected] : []}
              onSelect={handleChange}
              isMulti={false}
            />
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Typography variant="body2" gutterBottom>
          You are transferring "{product.name}" to a new owner.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Product transfer typically takes a few seconds to complete. The new owner will gain full access to the product and all its services.
        </Typography>
      </Gutters>
      <Gutters top="xl">
        <Button color="primary" onClick={() => setOpen(true)} disabled={!selected || transferring} variant="contained">
          {transferring ? 'Transferring...' : 'Transfer'}
        </Button>
        <Button disabled={transferring} onClick={onCancel}>
          Cancel
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
        title="Are you sure?"
        action="Transfer"
      >
        <Notice severity="error" gutterBottom fullWidth>
          You will lose all access and control of this product upon transfer.
        </Notice>
        <Typography variant="body2">
          You are about to transfer ownership of <b>{product.name}</b> and all of its services to
          <b> {selected}</b>.
        </Typography>
      </Confirm>
    </Container>
  )
}
