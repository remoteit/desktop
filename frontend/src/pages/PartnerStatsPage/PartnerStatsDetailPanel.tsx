import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Typography, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Box, Divider, TextField} from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLExportPartnerDevices, graphQLUpdatePartner } from '../../services/graphQLRequest'
import { windowOpen } from '../../services/browser'
import { spacing } from '../../styling'
import { getPartnerStats } from '../../models/partnerStats'
import { Dispatch } from '../../store'

export const PartnerStatsDetailPanel: React.FC = () => {
  const { t } = useTranslation()
  const { partnerId } = useParams<{ partnerId: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [exporting, setExporting] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const partnerStatsModel = useSelector(getPartnerStats)
  const { flattened: partners, fetching: loading } = partnerStatsModel

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
      alert(t('partnerStatsDetailPanel.exportFailed', 'Failed to export devices.'))
    }
  }

  const handleStartEditName = () => {
    setEditedName(partner?.name || '')
    setEditingName(true)
  }

  const handleCancelEditName = () => {
    setEditingName(false)
    setEditedName('')
  }

  const handleSaveName = async () => {
    const trimmed = editedName.trim()
    if (!trimmed || trimmed === partner?.name) {
      handleCancelEditName()
      return
    }
    setSavingName(true)
    const result = await graphQLUpdatePartner(partnerId, trimmed)
    setSavingName(false)
    if (result !== 'ERROR' && result?.data?.data?.updatePartner) {
      setEditingName(false)
      setEditedName('')
      dispatch.partnerStats.fetch()
    } else {
      alert(t('partnerStatsDetailPanel.updateNameFailed', 'Failed to update partner name.'))
    }
  }

  // Don't show anything if no partner is selected
  if (!partnerId) {
    return null
  }

  if (loading && !partner) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('partnerStatsDetailPanel.loadingPartner', 'Loading partner...')} />
      </Container>
    )
  }

  if (!partner) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('partnerStatsDetailPanel.partnerNotFound', 'Partner not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  const children = partner.children || []
  const admins = partner.admins || []
  const registrants = partner.registrants || []

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
                title={t('partnerStatsDetailPanel.backToPartners', 'Back to Partners')}
                onClick={handleBack}
                size="md"
              />
            </Box>
            <IconButton
              icon="arrow-to-bottom"
              title={t('partnerStatsDetailPanel.exportToCsv', 'Export devices to CSV')}
              onClick={handleExportDevices}
              disabled={exporting}
              spin={exporting}
              size="md"
            />
          </Box>
          <Box sx={{ paddingX: `${spacing.md}px`, paddingBottom: `${spacing.md}px` }}>
            {editingName ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  autoFocus
                  size="small"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEditName()
                  }}
                  disabled={savingName}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  icon={savingName ? 'spinner-third' : 'check'}
                  title={t('partnerStatsDetailPanel.save', 'Save')}
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  spin={savingName}
                  size="md"
                  color="success"
                />
                <IconButton
                  icon="times"
                  title={t('partnerStatsDetailPanel.cancel', 'Cancel')}
                  onClick={handleCancelEditName}
                  disabled={savingName}
                  size="md"
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h2">
                  <Title>{partner.name}</Title>
                </Typography>
                <IconButton
                  icon="pen"
                  title={t('partnerStatsDetailPanel.renamePartner', 'Rename partner')}
                  onClick={handleStartEditName}
                  size="sm"
                />
              </Box>
            )}
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
            <Title>{t('partnerStatsDetailPanel.parentPartner', 'Parent Partner')}</Title>
          </Typography>
          <List disablePadding>
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent!.id)}>
              <ListItemIcon>
                <Icon name="building" size="md" color="grayDark" />
              </ListItemIcon>
              <ListItemText
                primary={partner.parent.name}
                secondary={t('partnerStatsDetailPanel.partnerSummary', {
                  total: partner.parent.deviceCount || 0,
                  online: partner.parent.online || 0,
                  active: partner.parent.active || 0,
                  defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                })}
              />
              <Icon name="chevron-right" size="md" color="grayLight" />
            </ListItemButton>
          </List>
        </>
      )}

      {/* Device Counts */}
      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>{t('partnerStatsDetailPanel.deviceSummary', 'Device Summary')}</Title>
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText
            primary={t('partnerStatsDetailPanel.totalDevices', 'Total Devices')}
            secondary={partner.deviceCount || 0}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('partnerStatsDetailPanel.activated', 'Activated')}
            secondary={t('partnerStatsDetailPanel.devicesReportedOnce', {
              count: partner.activated || 0,
              defaultValue: '{{count}} devices have reported at least once',
            })}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('partnerStatsDetailPanel.activeLast30Days', 'Active (Last 30 Days)')}
            secondary={t('partnerStatsDetailPanel.devicesCount', {
              count: partner.active || 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemText
            primary={t('partnerStatsDetailPanel.currentlyOnline', 'Currently Online')}
            secondary={t('partnerStatsDetailPanel.devicesCount', {
              count: partner.online || 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })}
          />
        </ListItem>
      </List>

      {/* Children Partners */}
      {children.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 3 }}>
            <Title>
              {t('partnerStatsDetailPanel.childPartners', { count: children.length, defaultValue: 'Child Partners ({{count}})' })}
            </Title>
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
                    secondary={t('partnerStatsDetailPanel.partnerSummary', {
                      total: child.deviceCount || 0,
                      online: child.online || 0,
                      active: child.active || 0,
                      defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                    })}
                  />
                  <Icon name="chevron-right" size="md" color="grayLight" />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {/* Registrants in this Partner */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>
              {t('partnerStatsDetailPanel.registrants', { count: registrants.length, defaultValue: 'Registrants ({{count}})' })}
            </Title>
          </Typography>
        </Box>
        {registrants.length > 0 && (
          <List disablePadding>
            {registrants.map((user: any, index: number) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    <Icon name="user" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={user.email}
                    secondary={t('partnerStatsDetailPanel.partnerSummary', {
                      total: user.deviceCount || 0,
                      online: user.online || 0,
                      active: user.active || 0,
                      defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                    })}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </>

      {/* Admins in this Partner */}
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <Typography variant="subtitle1">
            <Title>
              {t('partnerStatsDetailPanel.admins', { count: admins.length, defaultValue: 'Admins ({{count}})' })}
            </Title>
          </Typography>
        </Box>
        {admins.length > 0 && (
          <List disablePadding>
            {admins.map((user: any, index: number) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    <Icon name="user-shield" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={user.email}
                    secondary={t('partnerStatsDetailPanel.partnerSummary', {
                      total: user.deviceCount || 0,
                      online: user.online || 0,
                      active: user.active || 0,
                      defaultValue: '{{total}} total • {{online}} online • {{active}} active',
                    })}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </>

    </Container>
  )
}
