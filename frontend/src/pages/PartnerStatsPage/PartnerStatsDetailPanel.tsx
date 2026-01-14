import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLExportPartnerDevices } from '../../services/graphQLRequest'
import { windowOpen } from '../../services/browser'
import { spacing } from '../../styling'
import { State } from '../../store'
import { getPartnerStatsModel } from '../../models/partnerStats'

export const PartnerStatsDetailPanel: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>()
  const history = useHistory()
  const [exporting, setExporting] = useState(false)
  const userId = useSelector((state: State) => state.user.id)
  const partnerStatsModel = useSelector((state: State) => getPartnerStatsModel(state))
  const { flattened: partners, all: rootPartners, fetching: loading } = partnerStatsModel

  // Find the partner in the flattened list
  const partner = useMemo(() => {
    if (!partnerId) return null
    return partners.find(p => p.id === partnerId)
  }, [partnerId, partners])

  const handleBack = () => {
    history.push('/partner-stats')
  }

  const handleNavigateToPartner = (id: string) => {
    history.push(`/partner-stats/${id}`)
  }

  const handleExportDevices = async () => {
    if (!partnerId) return
    setExporting(true)
    const result = await graphQLExportPartnerDevices(partnerId)
    setExporting(false)
    
    if (result !== 'ERROR' && result?.data?.data?.exportPartnerDevices) {
      const url = result.data.data.exportPartnerDevices
      windowOpen(url)
    } else {
      alert('Failed to export devices.')
    }
  }

  // Don't show anything if no partner is selected
  if (!partnerId) {
    return null
  }

  if (loading && !partner) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading partner..." />
      </Container>
    )
  }

  if (!partner) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Partner not found
          </Typography>
        </Body>
      </Container>
    )
  }

  const children = partner.children || []

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                icon="chevron-left"
                title="Back to Partners"
                onClick={handleBack}
                size="md"
              />
            </Box>
            <IconButton
              icon="arrow-to-bottom"
              title="Export devices to CSV"
              onClick={handleExportDevices}
              disabled={exporting}
              spin={exporting}
              size="md"
            />
          </Box>
          <Box sx={{ paddingX: `${spacing.md}px`, paddingBottom: `${spacing.md}px` }}>
            <Typography variant="h2">
              <Title>{partner.name}</Title>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                {partner.id}
              </Typography>
              <CopyIconButton value={partner.id} size="xs" />
            </Box>
          </Box>
          <Divider />
        </Box>
      }
    >
      {/* Parent Partner */}
      {partner.parent && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
            <Title>Parent Partner</Title>
          </Typography>
          <List disablePadding>
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent!.id)}>
              <ListItemIcon>
                <Icon name="building" size="md" color="grayDark" />
              </ListItemIcon>
              <ListItemText
                primary={partner.parent.name}
                secondary={`${partner.parent.deviceCount || 0} total • ${partner.parent.online || 0} online • ${partner.parent.active || 0} active`}
              />
              <Icon name="chevron-right" size="md" color="grayLight" />
            </ListItemButton>
          </List>
        </>
      )}

      {/* Device Counts */}
      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>Device Summary</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary="Total Devices"
            secondary={partner.deviceCount || 0}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Activated"
            secondary={`${partner.activated || 0} devices have reported at least once`}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Active (Last 30 Days)"
            secondary={`${partner.active || 0} devices`}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary="Currently Online"
            secondary={`${partner.online || 0} devices`}
          />
        </ListItem>
      </List>

      {/* Children Partners */}
      {children.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 3 }}>
            <Title>Child Partners ({children.length})</Title>
          </Typography>
          <List disablePadding>
            {children.map((child: any, index: number) => (
              <React.Fragment key={child.id}>
                {index > 0 && <Divider />}
                <ListItemButton onClick={() => handleNavigateToPartner(child.id)}>
                  <ListItemIcon>
                    <Icon name="building" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={child.name}
                    secondary={`${child.deviceCount || 0} total • ${child.online || 0} online • ${child.active || 0} active`}
                  />
                  <Icon name="chevron-right" size="md" color="grayLight" />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Container>
  )
}
