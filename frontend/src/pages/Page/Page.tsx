import React from 'react'
import styles from '../../styling'
import { makeStyles } from '@material-ui/styles'
import { isMac } from '../../services/Platform'
import { Header } from '../../jump/components/Header'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const css = useStyles()
  let containerCss: any = css.page

  if (!isMac()) containerCss += ' ' + css.win

  return (
    <div className={containerCss}>
      <Header />
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  page: {
    position: 'fixed',
    backgroundColor: styles.colors.grayLighter,
    borderRadius: 10,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  win: {
    borderColor: styles.colors.primary,
    borderWidth: 1,
    borderStyle: 'solid',
    boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.2)',
  },
  // content: {
  //   padding: `${styles.page.marginVertical}px ${styles.page.marginHorizontal}px`,
  //   height: '100%',
  //   'overflow-y': 'scroll',
  //   '-webkit-overflow-scrolling': 'touch',
  //   '&::-webkit-scrollbar': { display: 'none' },
  // },
})
