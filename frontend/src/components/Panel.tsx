import React from 'react'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'

type Props = { layout?: ILayout }

export const Panel: React.FC<Props> = ({ layout, children }) => {
  const css = useStyles({ layout: layout })

  return (
    <div className={css.panel}>
      <Header breadcrumbs={layout?.hideSidebar} />
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  panel: ({ layout }: Props) => ({
    flexGrow: 1,
    height: '100%',
    maxWidth: `calc(100% - ${layout?.hideSidebar ? 0 : SIDEBAR_WIDTH}px)`,
    display: 'flex',
    flexDirection: 'column',
  }),
})
