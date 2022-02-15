import React from 'react'
import classnames from 'classnames'
import { makeStyles, Divider } from '@material-ui/core'
import { spacing } from '../../styling'
import { Body } from '../Body'

type Props = {
  header?: any
  sidebar?: any
  footer?: any
  integrated?: boolean
  bodyProps?: any
  bodyRef?: React.RefObject<HTMLDivElement>
  gutterBottom?: boolean
  backgroundColor?: string
  className?: string
}

export const Container: React.FC<Props> = ({
  header,
  sidebar,
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
        <div className={integrated ? undefined : css.header}>
          {header}
          {integrated || !!backgroundColor || <Divider variant="inset" />}
        </div>
      )}
      {sidebar ? (
        <div className={css.sidebar}>
          <Body {...bodyProps} gutterBottom={gutterBottom}>
            {children}
          </Body>
          <div className={css.sideContent}>{sidebar}</div>
        </div>
      ) : (
        <Body bodyRef={bodyRef} {...bodyProps} gutterBottom={gutterBottom}>
          {children}
        </Body>
      )}
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
    zIndex: 7,
    backgroundColor: palette.white.main,
    borderBottom: backgroundColor && `1px solid ${palette.grayLighter.main}`,
    '& .MuiTypography-h1': {
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.xxs}px ${spacing.xl - 8}px ${spacing.xxs}px ${spacing.xl}px`,
      minHeight: 50,
    },
  }),
  sidebar: {
    display: 'flex',
    flexFlow: 'row',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sideContent: {
    display: 'flex',
    position: 'relative',
    zIndex: 6,
  },
  footer: {
    position: 'relative',
    zIndex: 7,
  },
}))
