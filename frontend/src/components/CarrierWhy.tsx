import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Link, Typography } from '@mui/material'
import type { CandidateWhy } from '../helpers/exitWords'

// Why a device cannot carry an exit or run a proxy server, with "How to allow it" where the cause is known.
export const CarrierWhy: React.FC<{ why: CandidateWhy }> = ({ why }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <Box component="span" display="block" data-why>
      <Typography component="span" variant="caption" color="textSecondary">
        {why.reason}
      </Typography>
      {why.howTo && (
        <>
          {' '}
          <Link
            component="button"
            variant="caption"
            underline="always"
            sx={{ verticalAlign: 'baseline' }}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation()
              setOpen(!open)
            }}
            data-how-to
          >
            {t('carry.howToAllow', 'How to allow it')}
          </Link>
          {open &&
            why.howTo.map(line => (
              <Typography
                key={line}
                component="span"
                display="block"
                variant="caption"
                color="textSecondary"
                sx={{
                  fontFamily: line.includes('remoteit-device') || line.includes('--cap-add') ? 'monospace' : undefined,
                  marginTop: 0.5,
                  wordBreak: 'break-word',
                }}
              >
                {line}
              </Typography>
            ))}
        </>
      )}
    </Box>
  )
}
