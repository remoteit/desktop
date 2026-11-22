import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { NAV_PAGES, subNavShown } from '../helpers/navSections'
import { useNavSections } from '../hooks/useNavSections'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'

/* A section's title and sub-links, heading the left panel wherever that panel shows one of the section's lists. */
export const SectionNav: React.FC<{ panels?: number }> = ({ panels = 1 }) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const counts = useCounts()
  const nav = useNavSections()
  const { page, section } = nav

  if (nav.remoteUI || !page || !section || section.pages.length < 2 || !subNavShown(page, pathname, panels))
    return null

  return (
    <Box component="nav" aria-label={section.label(t)} sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1 }}>
      <Typography variant="h2" component="h1" sx={{ marginBottom: 0.75 }}>
        {section.label(t)}
      </Typography>
      <Tabs
        value={page}
        variant="scrollable"
        scrollButtons={false}
        sx={theme => ({
          borderBottom: `1px solid ${theme.palette.grayLighter.main}`,
          '&::after': { display: 'none' },
          '& .MuiTabs-indicator': { height: 2, backgroundColor: theme.palette.primary.main },
          '& .MuiTab-root': {
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.grayDarker.main,
            padding: '6px 0 8px',
            marginRight: 3,
            borderRadius: 0,
            '&:hover': { backgroundColor: 'transparent', color: theme.palette.black.main },
            '&.Mui-selected': { backgroundColor: 'transparent', color: theme.palette.black.main },
          },
        })}
      >
        {section.pages.map(id => (
          <Tab
            key={id}
            value={id}
            label={
              id === 'connections' && counts.active ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {NAV_PAGES[id].label(t)}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {counts.active.toLocaleString(getLocale())}
                  </Box>
                </Box>
              ) : (
                NAV_PAGES[id].label(t)
              )
            }
            onClick={() => nav.open(id)}
          />
        ))}
      </Tabs>
    </Box>
  )
}
