import React, { useState } from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Box, Typography, Collapse } from '@mui/material'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { IconButton } from '../buttons/IconButton'
import { dispatch } from '../store'
import { Notice } from './Notice'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing, radius } from '../styling'
import { getProductsSelected } from '../selectors/products'
import { selectPermissions } from '../selectors/organizations'

type Props = {
  select?: boolean
}

export const ProductsActionBar: React.FC<Props> = ({ select }) => {
  const selected = useSelector(getProductsSelected)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [deleting, setDeleting] = useState(false)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const history = useHistory()
  const { t } = useTranslation()

  const clearSelectMode = () => history.push('/products')

  const handleDelete = async () => {
    setDeleting(true)
    await dispatch.products.deleteSelected()
    setDeleting(false)
    clearSelectMode()
  }

  return (
    <Collapse in={!!(select || selected.length)} mountOnEnter unmountOnExit>
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${theme.palette.white.main}`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: theme.palette.primary.main,
          borderRadius: `${radius.lg}px`,
          marginLeft: `${spacing.sm}px`,
          marginRight: `${spacing.sm}px`,
          marginBottom: `${spacing.xs}px`,
          paddingRight: `${spacing.sm}px`,
          zIndex: 10,
          '& .MuiTypography-subtitle1': {
            marginTop: `${spacing.xs}px`,
            marginBottom: `${spacing.xs}px`,
            fontWeight: 800,
            color: theme.palette.alwaysWhite.main,
          },
        })}
      >
        <Title>
          <Typography variant="subtitle1">
            {selected.length}&nbsp;
            {mobile ? <Icon name="check" inline /> : t('productsActionBar.selected', 'Selected')}
          </Typography>
        </Title>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ConfirmIconButton
            icon="trash"
            title={
              admin
                ? t('productsActionBar.deleteSelected', 'Delete selected')
                : t('productsActionBar.adminRequired', 'Admin permissions required')
            }
            color="alwaysWhite"
            placement="bottom"
            disabled={!admin || !selected.length}
            loading={deleting}
            onClick={handleDelete}
            confirmProps={{
              title: t('productsActionBar.confirmTitle', 'Confirm Product Deletion'),
              color: 'error',
              action: t('productsActionBar.confirmAction', {
                count: selected.length,
                defaultValue_one: 'Delete {{count}} product',
                defaultValue_other: 'Delete {{count}} products',
              }),
              children: (
                <>
                  <Notice severity="error" gutterBottom fullWidth>
                    {t('common.cannotBeUndone', 'This action cannot be undone.')}
                  </Notice>
                  <Typography variant="body2">
                    {t('productsActionBar.confirmBody', {
                      count: selected.length,
                      defaultValue_one: 'Are you sure you want to delete {{count}} product?',
                      defaultValue_other: 'Are you sure you want to delete {{count}} products?',
                    })}
                  </Typography>
                </>
              ),
            }}
            confirm
          />
          <IconButton
            icon="times"
            title={t('productsActionBar.clearSelection', 'Clear selection')}
            color="alwaysWhite"
            placement="bottom"
            onClick={() => {
              dispatch.products.clearSelection()
              clearSelectMode()
            }}
          />
        </Box>
      </Box>
    </Collapse>
  )
}
