import { List, ListProps } from '@mui/material'
import React, { useContext, useLayoutEffect, useRef, useState } from 'react'
import { fontSizes, spacing, toSxArray } from '../styling'
import { BesideDetailContext } from '../services/Context'
import { Attribute } from './Attributes'
import { GridListHeader, MIN_COLUMN_WIDTH } from './GridListHeader'

const MIN_FIT_NAME_WIDTH = 160

type DeviceListProps<TOptions = IDataOptions, THeaderContext = unknown> = ListProps & {
  attributes: Attribute<TOptions>[]
  required?: Attribute<TOptions>
  columnWidths: ILookup<number>
  mobile?: boolean
  fetching?: boolean
  rowHeight?: number
  rowShrink?: number
  headerIcon?: React.ReactNode | boolean
  headerContextData?: THeaderContext
  headerContextProvider?: React.Provider<THeaderContext>
}

export const GridList = <TOptions, THeaderContext = unknown>({
  attributes,
  required,
  columnWidths,
  mobile,
  fetching,
  rowHeight = 40,
  rowShrink = 0,
  headerIcon,
  headerContextData,
  headerContextProvider: HeaderContextProvider,
  children,
  sx,
  ...props
}: DeviceListProps<TOptions, THeaderContext>) => {
  const besideDetail = useContext(BesideDetailContext)
  const listRef = useRef<HTMLUListElement>(null)
  const [available, setAvailable] = useState<number>(0)
  useLayoutEffect(() => {
    const parent = besideDetail ? listRef.current?.parentElement : undefined
    if (!parent) return
    const observer = new ResizeObserver(() => setAvailable(parent.clientWidth))
    setAvailable(parent.clientWidth)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [besideDetail])

  const requiredWidth = required?.width(columnWidths) || 0
  const attributeWidths = attributes.map(attribute => attribute.width(columnWidths))
  const fullWidth = attributeWidths.reduce((total, width) => total + width, requiredWidth)
  const fit = besideDetail && !mobile && !!required && !!available && fullWidth > available

  let fitCount = attributes.length
  if (fit) {
    let room = available - MIN_FIT_NAME_WIDTH
    fitCount = attributeWidths.findIndex(width => (room -= width) < 0)
    if (fitCount < 0) fitCount = attributes.length
  }
  const shown = fit ? attributes.slice(0, fitCount) : attributes

  const columns = [requiredWidth, ...attributeWidths].filter(Boolean)
  const visibleColumns = mobile
    ? 'minmax(0, 1fr)'
    : fit
    ? ['minmax(0, 1fr)', ...attributeWidths.slice(0, fitCount).map(width => `${width}px`)].join(' ')
    : columns.map(width => `${width}px`).join(' ')

  const header = (
    <GridListHeader<TOptions> {...{ required, fetching, columnWidths, mobile }} attributes={shown} icon={headerIcon} />
  )

  return (
    <List
      sx={[
        {
          minWidth: '100%',
          width: mobile || fit ? '100%' : columns.reduce((total, width) => total + width, 0),
          '& .MuiListItemButton-root, & .MuiListSubheader-root': {
            gridTemplateColumns: visibleColumns,
          },
          [`& .MuiListItemButton-root > .MuiBox-root:nth-of-type(n + ${fitCount + 2})`]: fit ? { display: 'none' } : {},
          // Give the remaining columns room to scroll into view if the first one is very wide.
          [`@container scroll-body (width < ${requiredWidth + MIN_COLUMN_WIDTH}px)`]: {
            '& .GridList-pinned': { position: 'relative' },
          },
        },
        theme => ({
          '& .MuiListItemButton-root:nth-child(2)': {
            marginTop: `${rowShrink / 2}px`,
          },
          '& .MuiListItemButton-root, & .MuiListSubheader-root': {
            display: 'inline-grid',
            alignItems: 'start',
            '& > .MuiBox-root': {
              paddingRight: `${spacing.sm}px`,
            },
          },
          '& .MuiListItemButton-root': {
            minHeight: rowHeight - rowShrink,
            fontSize: fontSizes.base,
            color: theme.palette.grayDarkest.main,
          },
          '& > * > .MuiBox-root, & > * > * > .MuiBox-root': {
            display: 'flex',
            alignItems: 'center',
            minHeight: rowHeight - 6 - rowShrink,
          },
          '& .attribute': {
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            minHeight: rowHeight - 6 - rowShrink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          '& .attribute > *, & .attribute .MuiListItemText-root > *': {
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          '& .MuiDivider-root': {
            marginTop: `${rowShrink / 2 - 1}px`,
            marginBottom: `${rowShrink / 2 - 1}px`,
          },
        }),
        ...toSxArray(sx),
      ]}
      disablePadding
      ref={listRef}
      {...props}
    >
      {HeaderContextProvider && headerContextData !== undefined ? (
        <HeaderContextProvider value={headerContextData}>{header}</HeaderContextProvider>
      ) : (
        header
      )}
      {children}
    </List>
  )
}
