import React from 'react'
import { makeStyles, Divider } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { Body } from '../Body'

type Props = {
  header: any
  sidebar?: any
  footer?: any
  integrated?: boolean
  bodyProps?: any
  bodyRef?: React.RefObject<HTMLDivElement>
  gutterBottom?: boolean
  divider?: boolean
  backgroundColor?: string
}

export const Container: React.FC<Props> = ({
  header,
  sidebar,
  footer,
  integrated,
  bodyProps,
  bodyRef,
  gutterBottom,
  divider = true,
  backgroundColor,
  children,
}) => {
  const css = useStyles({ backgroundColor })

  return (
    <div className={css.container}>
      <div className={integrated ? undefined : css.header}>
        {header}
        {integrated || !!backgroundColor || <Divider variant="inset" />}
      </div>
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

const useStyles = makeStyles({
  container: ({ backgroundColor }: any) => ({
    backgroundColor,
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  }),
  header: ({ backgroundColor }: any) => ({
    position: 'relative',
    zIndex: 3,
    backgroundColor: colors.white,
    borderBottom: backgroundColor && `1px solid ${colors.grayLighter}`,
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
    boxShadow: `-1px 0 2px ${colors.grayLighter}`,
    position: 'relative',
    zIndex: 2,
  },
  footer: {
    position: 'relative',
    zIndex: 3,
  },
})
