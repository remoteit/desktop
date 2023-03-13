import React from 'react'
import { Notice } from './Notice'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const UpgradeNotice: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const { testUI } = useSelector((state: ApplicationState) => state.ui)
  const css = useStyles()

  return (
    <Notice
      severity="warning"
      gutterTop
      button={
        <Button variant="contained" color="warning" size="small" sx={{ paddingX: 5 }}>
          Subscribe
        </Button>
      }
    >
      Commercial use of Remote.It requires a subscription license starting with the first device.
    </Notice>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  style: { backgroundColor: palette.test.main },
}))
