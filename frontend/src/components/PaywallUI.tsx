import React from 'react'
import { Tooltip, Box } from '@material-ui/core'
import { ApplicationState } from '../store'
import { selectLimitsLookup } from '../models/organization'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

type Props = {
  limitName?: string
  title: string
  to?: string
}

export const PaywallUI: React.FC<Props> = ({ limitName = '', title, to = '/account/plans', children, ...props }) => {
  const limits = useSelector((state: ApplicationState) => selectLimitsLookup(state))
  const history = useHistory()

  if (limits[limitName]) return <>{children}</>

  return (
    <Tooltip title={title} placement="top" arrow>
      <Box {...props} onClick={() => history.push(to)}>
        {children}
      </Box>
    </Tooltip>
  )
}

// const useStyles = makeStyles(({ palette }) => ({
//   limited: {
//     background: `repeating-linear-gradient(
//       45deg,
//       transparent,
//       transparent 10px,
//       ${palette.warningHighlight.main} 10px,
//       ${palette.warningHighlight.main} 20px
//     )`,
//   },
// }))
