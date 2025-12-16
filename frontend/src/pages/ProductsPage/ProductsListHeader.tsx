import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, Button, Typography, useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { IconButton } from '../../buttons/IconButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { Icon } from '../../components/Icon'
import { Title } from '../../components/Title'
import { spacing } from '../../styling'
import { HIDE_SIDEBAR_WIDTH } from '../../constants'
import { Dispatch } from '../../store'

type Props = {
  showBack?: boolean
  onBack?: () => void
}

export const ProductsListHeader: React.FC<Props> = ({ showBack, onBack }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  
  const searchParams = new URLSearchParams(location.search)
  const isSelectMode = searchParams.get('select') === 'true'

  const toggleSelect = () => {
    const newParams = new URLSearchParams(location.search)
    if (isSelectMode) {
      newParams.delete('select')
    } else {
      newParams.set('select', 'true')
    }
    const search = newParams.toString()
    history.push(`${location.pathname}${search ? `?${search}` : ''}`)
  }

  return (
    <Box className={css.header}>
      <Box className={css.left}>
        {sidebarHidden && (
          <IconButton
            name="bars"
            size="md"
            color="grayDarker"
            onClick={() => dispatch.ui.set({ sidebarMenu: true })}
          />
        )}
        {showBack && (
          <IconButton
            icon="chevron-left"
            title="Back"
            onClick={onBack}
            size="md"
          />
        )}
        <RefreshButton size="md" color="grayDarker" />
        {sidebarHidden && (
          <Typography variant="h2" className={css.title}>
            <Title>Products</Title>
          </Typography>
        )}
      </Box>
      <Box className={css.right}>
        <IconButton
          onClick={toggleSelect}
          icon="check-square"
          type={isSelectMode ? 'solid' : 'regular'}
          color={isSelectMode ? 'primary' : undefined}
          title={isSelectMode ? 'Hide Select' : 'Show Select'}
        />
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => history.push('/products/add')}
          startIcon={<Icon name="plus" />}
        >
          Create
        </Button>
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    marginTop: spacing.sm, // 12px to match global header
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {},
}))

