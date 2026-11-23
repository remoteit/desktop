import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Tabs, TabsProps } from '@mui/material'

const FADE = 40

export const PageTabs: React.FC<TabsProps> = ({ sx, children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState<{ start: boolean; end: boolean }>({ start: false, end: false })

  const measure = useCallback(() => {
    const scroller = ref.current?.querySelector<HTMLElement>('.MuiTabs-scroller')
    if (!scroller) return
    const start = scroller.scrollLeft > 1
    const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1
    setFade(current => (current.start === start && current.end === end ? current : { start, end }))
  }, [])

  useLayoutEffect(() => {
    const scroller = ref.current?.querySelector<HTMLElement>('.MuiTabs-scroller')
    if (!scroller) return
    measure()
    scroller.addEventListener('scroll', measure, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(scroller)
    if (scroller.firstElementChild) observer?.observe(scroller.firstElementChild)
    return () => {
      scroller.removeEventListener('scroll', measure)
      observer?.disconnect()
    }
  }, [measure])

  const mask =
    fade.start || fade.end
      ? `linear-gradient(to right, ${fade.start ? 'transparent' : 'black'} 0, black ${
          fade.start ? FADE : 0
        }px, black calc(100% - ${fade.end ? FADE : 0}px), ${fade.end ? 'transparent' : 'black'} 100%)`
      : undefined

  return (
    <Tabs
      ref={ref}
      variant="scrollable"
      scrollButtons={false}
      {...props}
      sx={[
        theme => ({
          borderBottom: `1px solid ${theme.palette.grayLighter.main}`,
          '& .MuiTabs-scroller': mask ? { WebkitMaskImage: mask, maskImage: mask } : {},
          '& .MuiTabs-indicator': { height: 2, backgroundColor: theme.palette.primary.main },
          '& .MuiTab-root': {
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.grayDarker.main,
            padding: '6px 0 8px',
            marginRight: 3,
            borderRadius: 0,
            [theme.breakpoints.down('sm')]: { minHeight: 40, marginRight: 1 },
            '&:hover': { backgroundColor: 'transparent', color: theme.palette.black.main },
            '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: 'transparent', color: theme.palette.black.main },
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Tabs>
  )
}
