import React from 'react'
import Header from './Header'
import { makeStyles } from '@material-ui/styles'
import { IInterface } from '../common/types'
import { IUser } from 'remote.it'
import styles from '../styling/styling'

const Page: React.FC<{ show: boolean; user: IUser; interfaces: IInterface[] }> = ({
  show,
  user,
  interfaces,
  children,
}) => {
  const css = useStyles()
  return (
    <div style={{ display: show ? 'block' : 'none' }} className={css.content}>
      <Header user={user} interfaces={interfaces} />
      {children}
    </div>
  )
}

export default Page

const useStyles = makeStyles({
  content: {
    padding: `${styles.page.marginVertical}px ${styles.page.marginHorizontal}px`,
    height: '100%',
    'overflow-y': 'scroll',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
  },
})
