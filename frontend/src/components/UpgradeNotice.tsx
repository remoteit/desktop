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
      className={css.notice}
      severity="warning"
      button={
        <Button variant="contained" color="warning" size="small">
          Subscribe
        </Button>
      }
    >
      Commercial use requires a license after the first device.
    </Notice>
  )
}

const useStyles = makeStyles({
  notice: { zIndex: 9 },
})
