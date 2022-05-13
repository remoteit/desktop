import React from 'react'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'

type Props = { layout: ILayout }

export const Panel: React.FC<Props> = ({ layout, children }) => {
  const css = useStyles({ layout })

  return (
    <div className={css.panel}>
      <Header breadcrumbs={layout.singlePanel} />
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  panel: ({ layout }: Props) => ({
    flexGrow: 1,
    height: '100%',
    maxWidth: `calc(100% - ${layout.sidePanelWidth}px)`,
    display: 'flex',
    flexDirection: 'column',
  }),
})
