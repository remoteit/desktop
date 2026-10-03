import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { graphQLBasicRequest } from '../services/graphQL'

/* Signing in to a proxy's signed-in endpoint (presence-server docs/proxy-plan.md, phase 3): the proxy sends a visitor
   here — #/endpoint-sign-in?endpoint=<id>&return=<the endpoint's URL> — and this, signed in as them, asks graphql for a
   ticket for that endpoint (endpointTicket: only for someone who may connect to its service, and only back to the
   endpoint's own address) and goes back with it. */
export const EndpointSignInPage: React.FC = () => {
  const { t } = useTranslation()
  const params = new URLSearchParams(useLocation().search)
  const endpoint = params.get('endpoint') || ''
  const back = params.get('return') || ''
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    if (!endpoint || !back) return setProblem(t('endpointSignIn.missing', 'This sign-in link is incomplete.'))
    graphQLBasicRequest(
      ` mutation EndpointTicket($endpointId: String!, $returnUrl: String!) {
          endpointTicket(endpointId: $endpointId, returnUrl: $returnUrl)
        }`,
      { endpointId: endpoint, returnUrl: back }
    ).then(result => {
      const url = result === 'ERROR' ? null : result?.data?.data?.endpointTicket
      if (url) window.location.replace(url)
      else setProblem(t('endpointSignIn.refused', 'You do not have access to this endpoint.'))
    })
  }, [endpoint, back])

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="body1">{problem ?? t('endpointSignIn.signingIn', 'Signing you in…')}</Typography>
    </Box>
  )
}
