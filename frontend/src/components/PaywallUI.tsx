import React from 'react'
import { Tooltip, TooltipProps, Box } from '@mui/material'
import { ApplicationState } from '../store'
import { selectLimitsLookup } from '../selectors/organizations'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

type Props = {
  limitName?: string
  title: string
  to?: string
  placement?: TooltipProps['placement']
  children?: React.ReactNode
}

export const PaywallUI: React.FC<Props> = ({
  limitName = '',
  title,
  to = '/account/plans',
  placement,
  children,
  ...props
}) => {
  const limits = useSelector((state: ApplicationState) => selectLimitsLookup(state))
  const history = useHistory()

  if (limits[limitName]) return <>{children}</>

  return (
    <Tooltip title={title} placement={placement} enterDelay={600} arrow>
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
