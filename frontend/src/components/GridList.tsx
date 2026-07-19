import { List,ListProps } from '@mui/material'
import React from 'react'
import { fontSizes, spacing, toSxArray } from '../styling'
import { Attribute } from './Attributes'
import { GridListHeader } from './GridListHeader'

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
  const requiredWidth = required?.width(columnWidths) || 0

  const header = (
    <GridListHeader<TOptions> {...{ required, attributes, fetching, columnWidths, mobile }} icon={headerIcon} />
  )

  return (
    <List
      sx={[
        {
          minWidth: '100%',
          width: requiredWidth + (mobile ? 0 : attributes?.reduce((w, a) => w + a.width(columnWidths), 0)),
          '& .MuiListItemButton-root, & .MuiListSubheader-root': {
            gridTemplateColumns: `${requiredWidth ? `${requiredWidth}px ` : ''}${
              mobile ? '' : attributes?.map(a => a.width(columnWidths)).join('px ') + 'px'
            }`,
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
            minHeight: rowHeight - 6 - rowShrink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          '& .MuiDivider-root': {
            marginTop: `${rowShrink / 2 - 1}px`,
            marginBottom: `${rowShrink / 2 - 1}px`,
          },
        }),
        ...toSxArray(sx),
      ]}
      disablePadding
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
