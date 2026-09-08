import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, List, ListItemText, Box, Divider } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { OAUTH_ISSUER } from '../../constants'
import { Dispatch, State } from '../../store'
import { windowOpen } from '../../services/browser'

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.adminUsers.detailCache[userId])
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async (forceRefresh = false) => {
    setLoading(true)
    await dispatch.adminUsers.fetchUserDetail({ userId, force: forceRefresh })
    setLoading(false)
  }

  if (loading && !user) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading user..." />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            User not found
          </Typography>
        </Body>
      </Container>
    )
  }

  const deviceCount = user.info?.devices?.total || 0
  const deviceOnline = user.info?.devices?.online || 0

  const handleViewAsUser = () => {
    // Permitteer lane: view-as is a SUPPORT SESSION, not a header (docs/remoteit-desktop-
    // login.md Phase 4d). The X-R3-User lane is deliberately dead for these tokens (no
    // `delegate` scope is minted), so the eye button is a NAVIGATION into the AS
    // (permitteer docs/as-elevation.md): the AS runs every launch gate on the operator's own
    // session — the kill-switch, the operator roster, the target (never an operator), and its
    // own elevation stamp — then either opens this portal as the user straight away or shows its
    // "confirm it's you" page first (one tap with a factor, or the first factor's set-up) and
    // opens the portal from there. No admin console in between.
    // The EMAIL is the key both worlds share: permitteer subjects are sub_<hex>, not r3 GUIDs —
    // the authorizer joins them by email — and the AS resolves the user by email or id.
    // `origin` names THIS portal — the lane the operator is on (app.dev, app.evan, latest) — so
    // the support session lands here rather than on whichever redirect URI the client lists first
    // (the AS validates it against the registration).
    windowOpen(`${OAUTH_ISSUER}/elevate/launch?user=${encodeURIComponent(user.email || user.id)}&client=remoteit_portal&origin=${encodeURIComponent(window.location.origin)}`)
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="eye"
              title="View as User"
              onClick={handleViewAsUser}
              size="md"
              color="primary"
            />
          </Box>
          <List>
            <ListItemLocation
              to={`/admin/users/${user.id}/account`}
              match={`/admin/users/${user.id}/account`}
              icon={<Icon name="user" size="lg" color="grayDark" />}
              title={<Title>{user.email || user.id}</Title>}
            />
          </List>
          <Divider />
        </Box>
      }
    >
      <Typography variant="subtitle1">
        <Title>Devices</Title>
      </Typography>
      <List>
        <ListItemLocation
          to={`/admin/users/${user.id}/devices`}
          match={`/admin/users/${user.id}/devices`}
          dense
          icon={<Icon name="router" size="md" />}
        >
          <ListItemText
            primary="User Devices"
            secondary={`${deviceCount} total • ${deviceOnline} online • ${deviceCount - deviceOnline} offline`}
          />
        </ListItemLocation>
      </List>
    </Container>
  )
}
