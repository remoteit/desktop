import { Box } from '@mui/material'
import React from 'react'
import { spacing } from '../styling'
import { Attribute } from './Attributes'

type Props<TOptions = IDataOptions> = {
  attribute: Attribute<TOptions>
  sticky?: boolean
  onMouseDown: (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, attribute: Attribute<TOptions>) => void
  children?: React.ReactNode
}

export const GridListHeaderTitle = <TOptions,>({ attribute, sticky, onMouseDown, children }: Props<TOptions>) => {
  const justifyContent =
    attribute?.align === 'center' ? 'center' : attribute?.align === 'right' ? 'flex-end' : undefined

  const stickyCenter = sticky && justifyContent === 'center'

  return (
    <Box
      sx={[
        sticky
          ? theme => ({
              left: 0,
              zIndex: 4,
              position: 'sticky',
              paddingLeft: `${spacing.md}px`,
              backgroundImage: `linear-gradient(90deg, ${theme.palette.white.main} 95%, transparent)`,
              borderBottom: `1px solid ${theme.palette.grayLighter.main}`,
            })
          : theme => ({
              paddingLeft: `${spacing.xs}px`,
              paddingRight: `${spacing.sm}px !important`,
              backgroundColor: theme.palette.white.main,
              position: 'relative',
            }),
        stickyCenter ? { paddingLeft: 0, justifyContent: 'center' } : {},
      ]}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
    >
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          '& .hoverHide': { opacity: 0, transition: 'opacity 200ms' },
          '&:hover .hoverHide': { opacity: 1, transition: 'opacity 200ms' },
        }}
        style={justifyContent ? { justifyContent, width: '100%' } : undefined}
      >
        {children}
        {attribute.label}
      </Box>
      <Box
        component="span"
        sx={theme => ({
          right: 0,
          height: '100%',
          position: 'absolute',
          width: `${spacing.md}px`,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          '&:hover': {
            cursor: 'col-resize',
          },
          '&::after': {
            content: '""',
            width: '1px',
            height: `${spacing.sm}px`,
            display: 'block',
            background: theme.palette.grayLight.main,
          },
          '&:hover::after': {
            width: '3px',
            height: '100%',
            background: theme.palette.primary.main,
          },
        })}
        onMouseDown={event => onMouseDown(event, attribute)}
      />
    </Box>
  )
}
