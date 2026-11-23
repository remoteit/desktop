import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { Title } from './Title'
import { NAV_PAGES, pageTitleShown } from '../helpers/navSections'
import { useNavSections, useSectionList } from '../hooks/useNavSections'

export const PageHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1, flexShrink: 0 }}>
    <Typography variant="h2" component="h1">
      <Title>{children}</Title>
    </Typography>
  </Box>
)

export const PageTitle: React.FC<{ panels?: number }> = ({ panels = 1 }) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const nav = useNavSections()
  const list = useSectionList()

  if (nav.remoteUI || !nav.page || list.section || !pageTitleShown(nav.page, pathname, panels)) return null

  return <PageHeading>{NAV_PAGES[nav.page].label(t)}</PageHeading>
}
