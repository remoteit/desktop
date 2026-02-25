import { Box,Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import React,{ useEffect,useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Attribute } from '../../components/Attributes'
import { Body } from '../../components/Body'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { StatusChip } from '../../components/StatusChip'
import { TargetPlatform } from '../../components/TargetPlatform'
import { Timestamp } from '../../components/Timestamp'
import { Title } from '../../components/Title'
import { removeObject } from '../../helpers/utilHelper'
import { graphQLAdminUserDevices } from '../../services/graphQLRequest'
import { State } from '../../store'

type AdminDeviceAttributeOptions = {
  device?: AdminDeviceRow
}

type AdminDeviceRow = {
  id: string
  name?: string
  state?: IDevice['state']
  services?: unknown[]
  platform?: number
  lastReported?: string
}

class AdminDeviceAttribute extends Attribute<AdminDeviceAttributeOptions> {
  type: Attribute['type'] = 'DEVICE'
}

const adminDeviceAttributes: AdminDeviceAttribute[] = [
  new AdminDeviceAttribute({
    id: 'adminDeviceName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.name || device?.id,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceStatus',
    label: 'Status',
    defaultWidth: 100,
    value: ({ device }: AdminDeviceAttributeOptions) => (
      <StatusChip device={{ state: device?.state, services: (device?.services as IService[]) || [] } as IDevice} />
    ),
  }),
  new AdminDeviceAttribute({
    id: 'adminDevicePlatform',
    label: 'Platform',
    defaultWidth: 150,
    value: ({ device }: AdminDeviceAttributeOptions) => TargetPlatform({ id: device?.platform, label: true }),
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceServices',
    label: 'Services',
    defaultWidth: 80,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.services?.length || 0,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceLastReported',
    label: 'Last Reported',
    defaultWidth: 150,
    value: ({ device }: AdminDeviceAttributeOptions) =>
      device?.lastReported ? <Timestamp date={new Date(device.lastReported)} /> : '-',
  }),
]

export const AdminUserDevicesPanel: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const css = useStyles()
  const [devices, setDevices] = useState<AdminDeviceRow[]>([])
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
