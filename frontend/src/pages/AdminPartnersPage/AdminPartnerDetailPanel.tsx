import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Typography, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Box, Divider, Chip } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLAdminPartner } from '../../services/graphQLRequest'
import { spacing } from '../../styling'

export const AdminPartnerDetailPanel: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>()
  const history = useHistory()
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId])

  const fetchPartner = async () => {
    setLoading(true)
    const result = await graphQLAdminPartner(partnerId)
    if (result !== 'ERROR' && result?.data?.data?.admin?.partners?.[0]) {
      setPartner(result.data.data.admin.partners[0])
    }
    setLoading(false)
  }

  const handleBack = () => {
    history.push('/admin/partners')
  }

  const handleNavigateToPartner = (id: string) => {
    history.push(`/admin/partners/${id}`)
  }

  const handleNavigateToUser = (userId: string) => {
    history.push(`/admin/users/${userId}`)
  }

  if (loading) {
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

  const users = partner.users || []
  const children = partner.children || []
  
  // Split users into admins and registrants
  const admins = users.filter((u: any) => u.role === 'admin' || u.role === 'admin_registrant')
  const registrants = users.filter((u: any) => u.role === 'admin_registrant' || u.role === 'device_registrant')

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="chevron-left"
              title="Back to Partners"
              onClick={handleBack}
              size="md"
            />
            <IconButton
              icon="sync"
              title="Refresh partner"
              onClick={fetchPartner}
              spin={loading}
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
            <ListItemButton onClick={() => handleNavigateToPartner(partner.parent.id)}>
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

      {/* Registrants in this Partner */}
      {registrants.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 3 }}>
            <Title>Registrants ({registrants.length})</Title>
          </Typography>
          <List disablePadding>
            {registrants.map((user: any, index: number) => (
              <React.Fragment key={`registrant-${user.id}`}>
                {index > 0 && <Divider />}
                <ListItemButton onClick={() => handleNavigateToUser(user.id)}>
                  <ListItemIcon>
                    <Icon name="user" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.email}
                        <Chip label={user.role} size="small" variant="outlined" />
                      </Box>
                    }
                    secondary={`${user.deviceCount || 0} total • ${user.online || 0} online • ${user.active || 0} active`}
                  />
                  <Icon name="chevron-right" size="md" color="grayLight" />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {/* Admins in this Partner */}
      {admins.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ marginTop: 3 }}>
            <Title>Admins ({admins.length})</Title>
          </Typography>
          <List disablePadding>
            {admins.map((user: any, index: number) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItemButton onClick={() => handleNavigateToUser(user.id)}>
                  <ListItemIcon>
                    <Icon name="user-shield" size="md" color="grayDark" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.email}
                        <Chip label={user.role} size="small" variant="outlined" />
                      </Box>
                    }
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

