import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Box } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Attribute } from '../../components/Attributes'
import { TargetPlatform } from '../../components/TargetPlatform'
import { StatusChip } from '../../components/StatusChip'
import { Timestamp } from '../../components/Timestamp'
import { graphQLAdminUserDevices } from '../../services/graphQLRequest'
import { State } from '../../store'
import { makeStyles } from '@mui/styles'
import { removeObject } from '../../helpers/utilHelper'

class AdminDeviceAttribute extends Attribute {
  type: Attribute['type'] = 'DEVICE'
}

const adminDeviceAttributes: Attribute[] = [
  new AdminDeviceAttribute({
    id: 'adminDeviceName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ device }: { device: any }) => device?.name || device?.id,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceStatus',
    label: 'Status',
    defaultWidth: 100,
    value: ({ device }: { device: any }) => (
      <StatusChip device={{ state: device?.state, services: device?.services || [] }} />
    ),
  }),
  new AdminDeviceAttribute({
    id: 'adminDevicePlatform',
    label: 'Platform',
    defaultWidth: 150,
    value: ({ device }: { device: any }) => TargetPlatform({ id: device?.platform, label: true }),
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceServices',
    label: 'Services',
    defaultWidth: 80,
    value: ({ device }: { device: any }) => device?.services?.length || 0,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceLastReported',
    label: 'Last Reported',
    defaultWidth: 150,
    value: ({ device }: { device: any }) => device?.lastReported ? <Timestamp date={new Date(device.lastReported)} /> : '-',
  }),
]

export const AdminUserDevicesPanel: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const css = useStyles()
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminDeviceAttributes, a => a.required === true)

  useEffect(() => {
    if (userId) {
      fetchDevices()
    }
  }, [userId])

  const fetchDevices = async () => {
    setLoading(true)
    const result = await graphQLAdminUserDevices(userId, { from: 0, size: 100 })
    if (result !== 'ERROR' && result?.data?.data?.login?.account?.devices) {
      const data = result.data.data.login.account.devices
      setDevices(data.items || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading devices..." />
      </Container>
    )
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Typography variant="h2" sx={{ padding: 2 }}>
          <Title>User Devices ({total})</Title>
        </Typography>
      }
    >
      {devices.length === 0 ? (
        <Body center>
          <Icon name="router" size="xxl" color="grayLight" />
          <Typography variant="h3" gutterBottom sx={{ marginTop: 2 }}>
            No devices found
          </Typography>
        </Body>
      ) : (
        <GridList
          attributes={attributes}
          required={required}
          columnWidths={columnWidths}
          fetching={loading}
        >
          {devices.map(device => (
            <GridListItem
              key={device.id}
              disableGutters
              icon={<Icon name="router" size="md" color={device.state === 'active' ? 'primary' : 'grayLight'} />}
              required={required?.value({ device })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  <div className={css.truncate}>
                    {attribute.value({ device })}
                  </div>
                </Box>
              ))}
            </GridListItem>
          ))}
        </GridList>
      )}
    </Container>
  )
}

const useStyles = makeStyles(() => ({
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  },
}))

