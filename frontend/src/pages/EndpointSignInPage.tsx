import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Button, Typography } from '@mui/material'
import { EndpointTicket, endpointTicket } from '../services/endpointTicket'

/* Signing in to a proxy's signed-in endpoint (presence-server docs/proxy-plan.md, phase 3): the proxy sends a visitor
   here — #/endpoint-sign-in?endpoint=<id>&return=<the endpoint's URL> — and this, signed in as them, asks graphql for a
   ticket for that endpoint (endpointTicket: only for someone who may connect to its service, and only back to the
   endpoint's own address) and goes back with it. With several sign-ins in use it is asked as each in turn, the page's own
   person first (services/endpointTicket). A proxy sends a visitor whose session it was refused with
   &reason=access (graphql-api docs/PROXY-GROUPS.md §17): their pass revoked — a new one is given, as any sign-in —
   or their access lost, which graphql refuses here, said as access they no longer have. */
export const EndpointSignInPage: React.FC = () => {
  const { t } = useTranslation()
  const params = new URLSearchParams(useLocation().search)
  const endpoint = params.get('endpoint') || ''
  const back = params.get('return') || ''
  const lost = params.get('reason') === 'access'
  const [answer, setAnswer] = useState<Exclude<EndpointTicket, object>>()
  const [tries, setTries] = useState(0)
  const complete = !!endpoint && !!back

  useEffect(() => {
    if (!complete) return
    let current = true
    setAnswer(undefined)
    endpointTicket(endpoint, back).then(ticket => {
      if (!current) return
      if (typeof ticket === 'object') window.location.replace(ticket.url)
      else setAnswer(ticket)
    })
    return () => {
      current = false
    }
  }, [endpoint, back, complete, tries])

  const problem = !complete
    ? t('endpointSignIn.missing', 'This sign-in link is incomplete.')
    : answer === 'FAILED'
    ? t('endpointSignIn.failed', 'You could not be signed in. Check your connection and try again.')
    : answer && lost
    ? t('endpointSignIn.lost', 'You no longer have access to this endpoint.')
    : answer && t('endpointSignIn.refused', 'You do not have access to this endpoint.')

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="body1">{problem ?? t('endpointSignIn.signingIn', 'Signing you in…')}</Typography>
      {answer === 'FAILED' && (
        <Button variant="contained" size="small" sx={{ marginTop: 2 }} onClick={() => setTries(tries + 1)}>
          {t('endpointSignIn.retry', 'Try again')}
        </Button>
      )}
    </Box>
  )
}
