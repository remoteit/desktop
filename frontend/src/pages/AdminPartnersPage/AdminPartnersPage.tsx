import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { AdminPartnersListPage } from './AdminPartnersListPage'
import { AdminPartnerDetailPanel } from './AdminPartnerDetailPanel'
import { State } from '../../store'

const MIN_WIDTH = 250
const TWO_PANEL_WIDTH = 700
const DEFAULT_LEFT_WIDTH = 350

export const AdminPartnersPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId?: string }>()
  const css = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const layout = useSelector((state: State) => state.ui.layout)
  
  const [containerWidth, setContainerWidth] = useState<number>(1000)
  
  const leftPrimaryRef = useRef<HTMLDivElement>(null)
  const leftHandleRef = useRef<number>(DEFAULT_LEFT_WIDTH)
  const leftMoveRef = useRef<number>(0)
  const [leftWidth, setLeftWidth] = useState<number>(DEFAULT_LEFT_WIDTH)
  const [leftGrab, setLeftGrab] = useState<boolean>(false)

  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= TWO_PANEL_WIDTH ? 2 : 1)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  const onLeftMove = useCallback((event: MouseEvent) => {
    const fullWidth = containerRef.current?.offsetWidth || 1000
    leftHandleRef.current += event.clientX - leftMoveRef.current
    leftMoveRef.current = event.clientX
    if (leftHandleRef.current > MIN_WIDTH && leftHandleRef.current < fullWidth - MIN_WIDTH) {
      setLeftWidth(leftHandleRef.current)
    }
  }, [])

  const onLeftUp = useCallback((event: MouseEvent) => {
    setLeftGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onLeftMove)
    window.removeEventListener('mouseup', onLeftUp)
  }, [onLeftMove])

  const onLeftDown = (event: React.MouseEvent) => {
    setLeftGrab(true)
    leftMoveRef.current = event.clientX
    leftHandleRef.current = leftPrimaryRef.current?.offsetWidth || leftWidth
    event.preventDefault()
    window.addEventListener('mousemove', onLeftMove)
    window.addEventListener('mouseup', onLeftUp)
  }

  const hasPartnerSelected = !!partnerId
  const showLeft = !hasPartnerSelected || maxPanels >= 2
  const showRight = hasPartnerSelected

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {showLeft && (
          <>
            <Box 
              className={css.panel} 
              style={{ 
                width: hasPartnerSelected ? leftWidth : undefined,
                minWidth: hasPartnerSelected ? leftWidth : undefined,
                flex: hasPartnerSelected ? undefined : 1
              }} 
              ref={leftPrimaryRef}
            >
              <AdminPartnersListPage />
            </Box>
            
            {hasPartnerSelected && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={onLeftDown}>
                  <Box className={leftGrab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}
        
        {showRight && (
          <Box className={css.rightPanel}>
            <AdminPartnerDetailPanel />
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
  rightPanel: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: MIN_WIDTH,
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

