import React from 'react'
import { makeStyles, Tooltip, Box } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

type Props = {
  limitName?: string
  title: string
  to?: string
}

export const PaywallUI: React.FC<Props> = ({ limitName = '', title, to = '/account/plans', children, ...props }) => {
  const feature = useSelector((state: ApplicationState) => state.ui.feature)
  const history = useHistory()
  const css = useStyles()

  if (feature[limitName]) return <>{children}</>

  return (
    <Tooltip title={title} placement="left" arrow>
      <Box className={css.limited} {...props} onClick={() => history.push(to)}>
        {children}
      </Box>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  limited: {
    background: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      ${palette.warningHighlight.main} 10px,
      ${palette.warningHighlight.main} 20px
    )`,
  },
}))
