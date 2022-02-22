import React from 'react'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'

type Props = { singlePanel?: boolean }

export const Panel: React.FC<Props> = ({ singlePanel, children }) => {
  const css = useStyles({ singlePanel })

  return (
    <div className={css.panel}>
      <Header singlePanel={singlePanel} />
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  panel: ({ singlePanel }: Props) => ({
    flexGrow: 1,
    height: '100%',
    maxWidth: `calc(100% - ${singlePanel ? 0 : SIDEBAR_WIDTH}px)`,
    display: 'flex',
    flexDirection: 'column',
  }),
})
