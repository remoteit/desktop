import React from 'react'
import { Box, Divider } from '@mui/material'
import { spacing, radius } from '../../styling'
import { Body, BodyProps } from '../Body'

type Props = {
  header?: React.ReactNode
  drawer?: React.ReactNode
  footer?: React.ReactNode
  integrated?: boolean
  bodyProps?: BodyProps
  bodyRef?: React.RefObject<HTMLDivElement>
  gutterBottom?: boolean
  backgroundColor?: Color
  className?: string
  children?: React.ReactNode
}

export const Container: React.FC<Props> = ({
  header,
  drawer,
  footer,
  integrated,
  bodyProps,
  bodyRef,
  gutterBottom,
  backgroundColor,
  className,
  children,
}) => {
  return (
    <Box
      className={className}
      sx={theme => ({
        backgroundColor: backgroundColor ? theme.palette[backgroundColor].main : theme.palette.white.main,
        display: 'flex',
        alignItems: 'stretch',
        flexFlow: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      })}
    >
      {header && (
        <Box
          sx={theme => ({
            position: 'relative',
            zIndex: 10,
            backgroundColor: theme.palette.white.main,
            borderBottom: backgroundColor ? `1px solid ${theme.palette.grayLighter.main}` : undefined,
            '& .MuiTypography-h1': {
              display: 'flex',
              padding: `${spacing.xxs}px ${spacing.xl - 8}px ${spacing.xxs}px ${spacing.xl}px`,
            },
          })}
        >
          {header}
          {!integrated && !backgroundColor && <Divider variant="inset" />}
        </Box>
      )}
      {drawer && (
        <Box
          sx={theme => ({
            display: 'flex',
            flexFlow: 'row',
            flexGrow: 1,
            overflow: 'hidden',
            position: 'absolute',
            height: '100%',
            borderTopLeftRadius: `${radius.lg}px`,
            backgroundColor: theme.palette.white.main,
            boxShadow: `0 3px 5px ${theme.palette.shadow.main}`,
            right: 0,
            zIndex: 12,
          })}
        >
          {drawer}
        </Box>
      )}
      <Body bodyRef={bodyRef} {...bodyProps} gutterBottom={gutterBottom} scrollbarBackground={backgroundColor}>
        {children}
      </Body>
      {footer && (
        <Box sx={{ position: 'relative', zIndex: 7 }}>
          <Divider variant="inset" />
          {footer}
        </Box>
      )}
    </Box>
  )
}
