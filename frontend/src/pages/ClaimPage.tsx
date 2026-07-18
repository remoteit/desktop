import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Dispatch } from '../store'

export const ClaimPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { claimID } = useParams<{ claimID: string }>()

  useEffect(() => {
    dispatch.devices.claimDevice({ code: claimID.toUpperCase(), redirect: true })
  }, [])

  return (
    <LoadingMessage
      message={
        <>
          Claiming{' '}
          <Box
            component="span"
            sx={{
              fontFamily: "'Roboto Mono'",
              color: 'grayDarker.main',
              backgroundColor: 'grayLighter.main',
              paddingLeft: 1,
              paddingRight: 1,
              borderRadius: '8px',
            }}
          >
            {claimID.toUpperCase()}
          </Box>
        </>
      }
    />
  )
}
