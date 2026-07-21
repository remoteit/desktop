import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Dispatch, State } from '../../store'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'

const dateLabel = (date?: Date) => (date ? date.toLocaleString() : '—')

// Mirrors the server's Notice.visible() filter so admins can see at a glance whether a notice is
// actually reaching users right now, rather than just whether it is enabled.
const liveNow = (notice: IAdminNotice) => {
  const now = new Date()
  if (!notice.enabled) return false
  if (notice.from && notice.from > now) return false
  if (notice.until && notice.until <= now) return false
  return true
}

export const AdminNoticesListPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const notices = useSelector((state: State) => state.adminNotices.notices)
  const loading = useSelector((state: State) => state.adminNotices.loading)
  const initialized = useSelector((state: State) => state.adminNotices.initialized)

  const history = useHistory()
  const [removeTarget, setRemoveTarget] = useState<IAdminNotice | undefined>()

  useEffect(() => {
    dispatch.adminNotices.fetch()
  }, [])

  const handleNew = () => history.push('/admin/notices/new')
  const handleEdit = (notice: IAdminNotice) => history.push(`/admin/notices/${notice.id}`)

  const handleRemove = async () => {
    if (removeTarget) await dispatch.adminNotices.remove(removeTarget.id)
    setRemoveTarget(undefined)
  }

  if (loading && !initialized) return <LoadingMessage message="Loading notices..." />

  return (
    <Container
      gutterBottom
      header={
        <Gutters>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h1">Notices</Typography>
            <Button variant="contained" size="small" onClick={handleNew}>
              New notice
            </Button>
          </Stack>
        </Gutters>
      }
    >
      {!notices.length ? (
        <Gutters>
          <Notice severity="info" fullWidth>
            No notices yet
            <em>Create one to announce maintenance, an outage, or a release.</em>
          </Notice>
        </Gutters>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Until</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.map(notice => (
                <TableRow key={notice.id} hover>
                  <TableCell>
                    {liveNow(notice) ? (
                      <Chip label="Live" size="small" color="primary" />
                    ) : (
                      <Chip label={notice.enabled ? 'Scheduled' : 'Disabled'} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{notice.type}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{notice.title}</Typography>
                    {notice.preview && (
                      <Typography variant="caption" color="textSecondary">
                        {notice.preview}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{notice.stage || 'all'}</TableCell>
                  <TableCell>{dateLabel(notice.from)}</TableCell>
                  <TableCell>
                    {notice.type === 'BANNER' && !notice.until ? (
                      <Tooltip title="Banners cannot be dismissed — set an end date">
                        <span>
                          <Icon name="exclamation-triangle" size="sm" color="warning" /> none
                        </span>
                      </Tooltip>
                    ) : (
                      dateLabel(notice.until)
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(notice)}>
                        <Icon name="pen" size="sm" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setRemoveTarget(notice)}>
                        <Icon name="trash" size="sm" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Confirm
        open={!!removeTarget}
        title="Delete notice?"
        onConfirm={handleRemove}
        onDeny={() => setRemoveTarget(undefined)}
        action="Delete"
        color="error"
      >
        <Typography variant="body2">
          "{removeTarget?.title}" will be permanently deleted. This cannot be undone.
        </Typography>
      </Confirm>
    </Container>
  )
}
