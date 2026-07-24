import { Box,Typography } from '@mui/material'
import React,{ useEffect,useState } from 'react'
import { useTranslation } from 'react-i18next'
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

const getAdminDeviceAttributes = (t: (key: string, defaultValue: string) => string): AdminDeviceAttribute[] => [
  new AdminDeviceAttribute({
    id: 'adminDeviceName',
    label: t('adminUserDevicesPanel.name', 'Name'),
    defaultWidth: 250,
    required: true,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.name || device?.id,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceStatus',
    label: t('adminUserDevicesPanel.status', 'Status'),
    defaultWidth: 100,
    value: ({ device }: AdminDeviceAttributeOptions) => (
      <StatusChip device={{ state: device?.state, services: (device?.services as IService[]) || [] } as IDevice} />
    ),
  }),
  new AdminDeviceAttribute({
    id: 'adminDevicePlatform',
    label: t('adminUserDevicesPanel.platform', 'Platform'),
    defaultWidth: 150,
    value: ({ device }: AdminDeviceAttributeOptions) => TargetPlatform({ id: device?.platform, label: true }),
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceServices',
    label: t('adminUserDevicesPanel.services', 'Services'),
    defaultWidth: 80,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.services?.length || 0,
  }),
  new AdminDeviceAttribute({
    id: 'adminDeviceLastReported',
    label: t('adminUserDevicesPanel.lastReported', 'Last Reported'),
    defaultWidth: 150,
    value: ({ device }: AdminDeviceAttributeOptions) =>
      device?.lastReported ? <Timestamp date={new Date(device.lastReported)} /> : '-',
  }),
]

export const AdminUserDevicesPanel: React.FC = () => {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const [devices, setDevices] = useState<AdminDeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const adminDeviceAttributes = getAdminDeviceAttributes(t)
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
        <LoadingMessage message={t('adminUserDevicesPanel.loading', 'Loading devices...')} />
      </Container>
    )
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Typography variant="h2" sx={{ padding: 2 }}>
          <Title>
            {t('adminUserDevicesPanel.userDevicesCount', { count: total, defaultValue: 'User Devices ({{count}})' })}
          </Title>
        </Typography>
      }
    >
      {devices.length === 0 ? (
        <Body center>
          <Icon name="router" size="xxl" color="grayLight" />
          <Typography variant="h3" gutterBottom sx={{ marginTop: 2 }}>
            {t('adminUserDevicesPanel.noDevicesFound', 'No devices found')}
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
                  <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                    {attribute.value({ device })}
                  </Box>
                </Box>
              ))}
            </GridListItem>
          ))}
        </GridList>
      )}
    </Container>
  )
}

