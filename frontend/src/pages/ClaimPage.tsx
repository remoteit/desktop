import React, { useEffect } from 'react'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { useParams } from 'react-router-dom'
import { Dispatch } from '../store'

export const ClaimPage: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { claimID } = useParams<{ claimID: string }>()

  useEffect(() => {
    dispatch.devices.claimDevice({ code: claimID.toUpperCase(), redirect: true })
  }, [])

  return (
    <LoadingMessage
      message={
        <>
          Claiming <span className={css.code}>{claimID.toUpperCase()}</span>
        </>
      }
    />
  )
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  code: {
    fontFamily: "'Roboto Mono'",
    color: palette.grayDarker.main,
    backgroundColor: palette.grayLighter.main,
    paddingLeft: spacing(1),
    paddingRight: spacing(1),
    borderRadius: spacing(1),
  },
}))
