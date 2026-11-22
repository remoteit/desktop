import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Typography } from '@mui/material'
import { Container } from '../components/Container'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { Gutters } from '../components/Gutters'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { OAUTH_MCP_RESOURCE, MCP_CONNECT_DOCS_LINK } from '../constants'

const Step: React.FC<{ number: number; label: string; children?: React.ReactNode }> = ({ number, label, children }) => (
  <Stack component="li" direction="row" spacing={1.5} marginBottom={2}>
    <Box
      sx={theme => ({
        flexShrink: 0,
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `1px solid ${theme.palette.grayLight.main}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Typography variant="caption" fontWeight={500} color="grayDarkest.main">
        {number}
      </Typography>
    </Box>
    <Box flexGrow={1} paddingTop="3px">
      <Typography variant="body2">{label}</Typography>
      {children}
    </Box>
  </Stack>
)

export const ConnectAIPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ maxWidth: 720, height: '100%', minHeight: 0 }}>
      <Container gutterBottom>
        <Gutters>
          <Typography variant="body1">
            {t(
              'connectAiPage.intro',
              'Connect Claude, ChatGPT or another AI assistant to your Remote.It account. Then just ask it to check on your devices, open connections or run scripts.'
            )}
          </Typography>
        </Gutters>
        <Typography variant="subtitle1">{t('connectAiPage.howTo', 'How to connect')}</Typography>
        <Gutters top={null} inset="md">
          <Box component="ol" sx={{ listStyle: 'none', margin: 0, paddingX: 0, paddingY: 2 }}>
            <Step number={1} label={t('connectAiPage.step1', 'Copy the Remote.It MCP server URL.')}>
              <CopyCodeBlock value={OAUTH_MCP_RESOURCE} hideCopyLabel sx={{ marginTop: 1 }} />
            </Step>
            <Step
              number={2}
              label={t(
                'connectAiPage.step2',
                'In your AI assistant, add a custom connector (or remote MCP server) and paste the URL.'
              )}
            />
            <Step
              number={3}
              label={t('connectAiPage.step3', 'Sign in with your Remote.It account when asked. No API keys needed.')}
            />
          </Box>
          <Link href={MCP_CONNECT_DOCS_LINK} noUnderline>
            {t('connectAiPage.setupGuides', 'Setup guides for Claude, ChatGPT and more')}
            <Icon name="launch" size="sm" />
          </Link>
        </Gutters>
      </Container>
    </Box>
  )
}
