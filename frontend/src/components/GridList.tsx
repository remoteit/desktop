import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { List, ListProps } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { GridListHeader } from './GridListHeader'
import { Attribute } from './Attributes'

type DeviceListProps = ListProps & {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  mobile?: boolean
  fetching?: boolean
  rowHeight?: number
  rowShrink?: number
  headerIcon?: React.ReactNode
  headerContextData?: any
  headerContextProvider?: React.Provider<any>
}

export const GridList: React.FC<DeviceListProps> = ({
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
  ...props
}) => {
  const requiredWidth = required?.width(columnWidths) || 0
  const css = useStyles({
    attributes,
    requiredWidth,
    columnWidths,
    rowHeight,
    rowShrink,
    mobile,
  })

  const header = <GridListHeader {...{ required, attributes, fetching, columnWidths, mobile }} icon={headerIcon} />

  return (
    <List className={classnames(css.list, css.grid)} disablePadding {...props}>
      {HeaderContextProvider ? (
        <HeaderContextProvider value={headerContextData}>{header}</HeaderContextProvider>
      ) : (
        header
      )}
      {children}
    </List>
  )
}

type StyleProps = {
  attributes: Attribute[]
  requiredWidth: number
  columnWidths: ILookup<number>
  mobile?: boolean
  rowHeight: number
  rowShrink: number
}

const useStyles = makeStyles(({ palette }) => ({
  grid: ({ attributes, requiredWidth, columnWidths, mobile }: StyleProps) => ({
    minWidth: '100%',
    width: requiredWidth + (mobile ? 0 : attributes?.reduce((w, a) => w + a.width(columnWidths), 0)),
    '& .MuiListItemButton-root, & .MuiListSubheader-root': {
      gridTemplateColumns: `${requiredWidth ? `${requiredWidth}px ` : ''}${
        mobile ? '' : attributes?.map(a => a.width(columnWidths)).join('px ') + 'px'
      }`,
    },
  }),
  list: ({ rowHeight, rowShrink }: StyleProps) => ({
    '& .MuiListItemButton-root:nth-child(2)': {
      marginTop: rowShrink / 2,
    },
    '& .MuiListItemButton-root, & .MuiListSubheader-root': {
      display: 'inline-grid',
      alignItems: 'start',
      '& > .MuiBox-root': {
        paddingLeft: spacing.xs,
        paddingRight: spacing.sm,
      },
    },
    '& .MuiListItemButton-root': {
      minHeight: rowHeight - rowShrink,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
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
      marginTop: rowShrink / 2 - 1,
      marginBottom: rowShrink / 2 - 1,
    },
  }),
}))
