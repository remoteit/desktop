import React from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Typography } from '@mui/material'
import { Container } from '../components/Container'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { OAUTH_MCP_RESOURCE, MCP_CONNECT_DOCS_LINK, MCP_DOCS_LINK } from '../constants'

const Step: React.FC<{ number: number; children: React.ReactNode }> = ({ number, children }) => (
  <Stack direction="row" spacing={1.5} marginBottom={1}>
    <Typography variant="body2" fontWeight={600} color="primary">
      {number}
    </Typography>
    <Typography variant="body2">{children}</Typography>
  </Stack>
)

export const AIAssistantsPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('aiAssistantsPage.title', 'AI Assistants')}</Title>
        </Typography>
      }
    >
      <Gutters>
        <Typography variant="body1">
          {t(
            'aiAssistantsPage.intro',
            'Connect Claude, ChatGPT or another AI assistant to your Remote.It account. Then just ask it to check on your devices, open connections or run scripts.'
          )}
        </Typography>
      </Gutters>
      <Typography variant="subtitle1">{t('aiAssistantsPage.howTo', 'How to connect')}</Typography>
      <Gutters top={null}>
        <Step number={1}>{t('aiAssistantsPage.step1', 'Copy the Remote.It MCP server URL.')}</Step>
        <CopyCodeBlock value={OAUTH_MCP_RESOURCE} hideCopyLabel sx={{ marginBottom: 2 }} />
        <Step number={2}>
          {t(
            'aiAssistantsPage.step2',
            'In your AI assistant, add a custom connector (or remote MCP server) and paste the URL.'
          )}
        </Step>
        <Step number={3}>
          {t('aiAssistantsPage.step3', 'Sign in with your Remote.It account when asked. No API keys needed.')}
        </Step>
      </Gutters>
      <Gutters bottom="xl">
        <Stack spacing={1} alignItems="flex-start">
          <Link href={MCP_CONNECT_DOCS_LINK}>
            {t('aiAssistantsPage.connectGuides', 'Step-by-step guides for Claude, ChatGPT, Grok, Gemini and Kiro')}
            <Icon name="launch" size="sm" />
          </Link>
          <Link href={MCP_DOCS_LINK}>
            {t('aiAssistantsPage.learnMore', 'What your assistant can do with Remote.It')}
            <Icon name="launch" size="sm" />
          </Link>
        </Stack>
      </Gutters>
    </Container>
  )
}
