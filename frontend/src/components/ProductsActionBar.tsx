import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Box, Typography, Collapse } from '@mui/material'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { IconButton } from '../buttons/IconButton'
import { dispatch } from '../store'
import { Notice } from './Notice'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing, radius } from '../styling'

type Props = {
  select?: boolean
}

export const ProductsActionBar: React.FC<Props> = ({ select }) => {
  const productsState = useSelector((state: State) => state.products)
  const selected = productsState?.selected || []
  const [deleting, setDeleting] = useState(false)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const history = useHistory()
  const css = useStyles()

  const handleDelete = async () => {
    setDeleting(true)
    await dispatch.products.deleteSelected()
    setDeleting(false)
    history.push('/products')
  }

  return (
    <Collapse in={!!(select || selected.length)} mountOnEnter unmountOnExit>
      <Box className={css.actions}>
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
              history.push('/products')
            }}
          />
        </Box>
      </Box>
    </Collapse>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: `1px solid ${palette.white.main}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: palette.primary.main,
    borderRadius: radius.lg,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    paddingRight: spacing.sm,
    zIndex: 10,
    '& .MuiTypography-subtitle1': {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      fontWeight: 800,
      color: palette.alwaysWhite.main,
    },
  },
}))

