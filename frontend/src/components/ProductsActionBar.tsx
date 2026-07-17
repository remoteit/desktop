import React, { useState } from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Box, Typography, Collapse } from '@mui/material'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { IconButton } from '../buttons/IconButton'
import { dispatch } from '../store'
import { Notice } from './Notice'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing, radius } from '../styling'
import { getProductsSelected } from '../selectors/products'

type Props = {
  select?: boolean
}

export const ProductsActionBar: React.FC<Props> = ({ select }) => {
  const selected = useSelector(getProductsSelected)
  const [deleting, setDeleting] = useState(false)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const history = useHistory()
  const location = useLocation()

  const clearSelectMode = () => {
    const newParams = new URLSearchParams(location.search)
    newParams.delete('select')
    const search = newParams.toString()
    history.push(`${location.pathname}${search ? `?${search}` : ''}`)
  }

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
            {mobile ? <Icon name="check" inline /> : 'Selected'}
          </Typography>
        </Title>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ConfirmIconButton
            icon="trash"
            title="Delete selected"
            color="alwaysWhite"
            placement="bottom"
            disabled={!selected.length}
            loading={deleting}
            onClick={handleDelete}
            confirmProps={{
              title: 'Confirm Product Deletion',
              color: 'error',
              action: `Delete ${selected.length} product${selected.length === 1 ? '' : 's'}`,
              children: (
                <>
                  <Notice severity="error" gutterBottom fullWidth>
                    This action cannot be undone.
                  </Notice>
                  <Typography variant="body2">
                    Are you sure you want to delete {selected.length} product
                    {selected.length === 1 ? '' : 's'}?
                  </Typography>
                </>
              ),
            }}
            confirm
          />
          <IconButton
            icon="times"
            title="Clear selection"
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

