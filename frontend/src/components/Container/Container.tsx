import React from 'react'
import classnames from 'classnames'
import { Divider } from '@mui/material'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles({ backgroundColor })
  return (
    <div className={classnames(className, css.container)}>
      {header && (
        <div className={css.header}>
          {header}
          {integrated || !!backgroundColor || <Divider variant="inset" />}
        </div>
      )}
      {drawer && <div className={css.drawer}>{drawer}</div>}
      <Body bodyRef={bodyRef} {...bodyProps} gutterBottom={gutterBottom} scrollbarBackground={backgroundColor}>
        {children}
      </Body>
      {footer && (
        <div className={css.footer}>
          <Divider variant="inset" />
          {footer}
        </div>
      )}
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: ({ backgroundColor }: any) => ({
    backgroundColor: backgroundColor ? palette[backgroundColor].main : palette.white.main,
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  }),
  header: ({ backgroundColor }: any) => ({
    position: 'relative',
    zIndex: 10,
    backgroundColor: palette.white.main,
    borderBottom: backgroundColor && `1px solid ${palette.grayLighter.main}`,
    '& .MuiTypography-h1': {
      display: 'flex',
      padding: `${spacing.xxs}px ${spacing.xl - 8}px ${spacing.xxs}px ${spacing.xl}px`,
    },
  }),
  drawer: {
    display: 'flex',
    flexFlow: 'row',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'absolute',
    height: '100%',
    borderTopLeftRadius: radius.lg,
    backgroundColor: palette.white.main,
    boxShadow: `0 3px 5px ${palette.shadow.main}`,
    right: 0,
    zIndex: 12,
  },
  footer: {
    position: 'relative',
    zIndex: 7,
  },
}))
