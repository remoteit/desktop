import React from 'react'
import { Switch, Route, useParams, Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { ProductsPage } from './ProductsPage'
import { ProductPage } from './ProductPage'
import { ProductSettingsPage } from './ProductSettingsPage'
import { ProductServiceDetailPage } from './ProductServiceDetailPage'
import { ProductServiceAddPage } from './ProductServiceAddPage'
import { ProductTransferPage } from './ProductTransferPage'
import { getProductModel } from '../../selectors/products'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const THREE_PANEL_WIDTH = 961 // Width threshold for showing 3 panels
const DEFAULT_LEFT_WIDTH = 300
const DEFAULT_RIGHT_WIDTH = 350

export const ProductsWithDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const css = useStyles()

  // Get layout from Redux for singlePanel breakpoint (750px)
  const layout = useSelector((state: State) => state.ui.layout)

  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })
  const rightPanel = useResizablePanel(DEFAULT_RIGHT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })

  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  // Determine panel count based on layout.singlePanel and container width
  // - singlePanel (<=750px): 1 panel
  // - !singlePanel + wide container (>=900px): 3 panels
  // - !singlePanel + narrow container: 2 panels
  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= THREE_PANEL_WIDTH ? 3 : 2)

  // Determine which panels to show based on available space
  // Priority: right panel > middle panel > left panel
  const showLeft = maxPanels >= 3
  const showMiddle = maxPanels >= 2
  const showRight = maxPanels >= 1

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {/* Left Panel - Products List */}
        {showLeft && (
          <>
            <Box
              className={css.panel}
              style={{ width: leftPanel.width, minWidth: leftPanel.width }}
              ref={leftPanel.panelRef}
            >
              <ProductsPage showHeader />
            </Box>

            {/* Left Divider */}
            <Box className={css.anchor}>
              <Box className={css.handle} onMouseDown={leftPanel.onDown}>
                <Box className={leftPanel.grab ? 'active' : undefined} />
              </Box>
            </Box>
          </>
        )}

        {/* Middle Panel - Product Details */}
        {showMiddle && (
          <>
            <Box className={css.middlePanel}>
              <ProductPage showRefresh={!showLeft} />
            </Box>

            {/* Right Divider */}
            <Box className={css.anchor}>
              <Box className={css.handle} onMouseDown={rightPanel.onDown}>
                <Box className={rightPanel.grab ? 'active' : undefined} />
              </Box>
            </Box>
          </>
        )}

        {/* Right Panel - Settings/Service Details */}
        {showRight && (
          <Box
            className={css.rightPanel}
            style={showMiddle ? { width: rightPanel.width, minWidth: rightPanel.width } : undefined}
          >
            <Switch>
              <Route path="/products/:productId/add">
                <ProductServiceAddPage showBack={!showMiddle} />
              </Route>
              <Route path="/products/:productId/transfer">
                <ProductTransferPage showBack={!showMiddle} />
              </Route>
              <Route path="/products/:productId/details">
                <ProductSettingsPage showBack={!showMiddle} />
              </Route>
              <Route path="/products/:productId/:serviceId">
                <ProductServiceDetailPage showBack={!showMiddle} />
              </Route>
              <Route path="/products/:productId" exact>
                {/* In single panel mode, show ProductPage; otherwise redirect to details */}
                {showMiddle ? (
                  <Redirect to={`/products/${productId}/details`} />
                ) : (
                  <ProductPage showRefresh />
                )}
              </Route>
            </Switch>
          </Box>
        )}
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
  panel: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  middlePanel: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: MIN_WIDTH,
    paddingLeft: 8,
    paddingRight: 8,
  },
  rightPanel: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    // When shown alone, take full width
    flex: 1,
  },
  anchor: {
    position: 'relative',
    height: '100%',
  },
  handle: {
    zIndex: 8,
    position: 'absolute',
    height: '100%',
    marginLeft: -5,
    padding: '0 3px',
    cursor: 'col-resize',
    '& > div': {
      width: 1,
      marginLeft: 1,
      marginRight: 1,
      height: '100%',
      backgroundColor: palette.grayLighter.main,
      transition: 'background-color 100ms 200ms, width 100ms 200ms, margin 100ms 200ms',
    },
    '&:hover > div, & .active': {
      width: 3,
      marginLeft: 0,
      marginRight: 0,
      backgroundColor: palette.primary.main,
    },
  },
}))
