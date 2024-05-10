import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { selectPlan } from '../selectors/organizations'
import { PERSONAL_PLAN_ID } from '../models/plans'
import { useSelector } from 'react-redux'
import { ColorChip } from './ColorChip'
import { Notice } from './Notice'
import { Box } from '@mui/material'

export const UpgradeBanner: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true)
  const plan = useSelector(selectPlan)
  if (plan?.id === PERSONAL_PLAN_ID || !open) return null
  return (
    <Notice gutterBottom>
      Access premium features & support
      <Box marginTop={1.4}>
        <Link to="/account/plans">
          <ColorChip size="small" variant="contained" color="primary" label="Upgrade Plan" />
        </Link>
      </Box>
    </Notice>
  )
}
