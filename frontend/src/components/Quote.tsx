import React from 'react'
import { spacing, Sizes, LIST_ITEM_PADDING_Y, LIST_ITEM_MARGIN_Y } from '../styling'
import { Box } from '@mui/material'

type Props = {
  margin?: Sizes | null
  indent?: 'listItem' | 'checkbox'
  noInset?: boolean
  spanRow?: boolean
  className?: string
  children?: React.ReactNode
}

// spanRow: the Quote sits inside a list row and reaches over the row's own padding and margin, so the lines
// of stacked quoted rows join instead of breaking at every row's edge
const ROW_SPAN = `${LIST_ITEM_PADDING_Y + LIST_ITEM_MARGIN_Y}px`

export const Quote: React.FC<Props> = ({ margin = 'lg', indent, noInset, spanRow, className, children }) => {
  let marginLeft: number | undefined
  if (indent === 'listItem') marginLeft = 27
  if (indent === 'checkbox') marginLeft = 14
  const marginY = spanRow ? `-${ROW_SPAN}` : margin ? `${spacing[margin]}px` : undefined
  return (
    <Box
      className={className}
      sx={theme => ({
        width: `calc(100% - ${marginLeft}px)`,
        position: 'relative',
        marginTop: marginY,
        marginBottom: marginY,
        paddingTop: spanRow ? ROW_SPAN : undefined,
        paddingBottom: spanRow ? ROW_SPAN : undefined,
        paddingLeft: noInset ? undefined : `${spacing.lg}px`,
        borderLeft: `1px solid ${theme.palette.grayLighter.main}`,
        marginLeft: marginLeft !== undefined ? `${marginLeft}px` : undefined,
      })}
    >
      {children}
    </Box>
  )
}
