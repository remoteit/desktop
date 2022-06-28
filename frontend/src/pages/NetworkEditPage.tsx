import React, { useEffect } from 'react'
import { Typography } from '@mui/material'
import { DEFAULT_ID } from '../models/networks'
import { selectNetwork } from '../models/networks'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { ListItemLocation } from '../components/ListItemLocation'
import { NetworkSettings } from '../components/NetworkSettings'
import { ListHorizontal } from '../components/ListHorizontal'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const NetworkEditPage: React.FC = () => {
  const { networkID } = useParams<{ networkID?: string }>()
  const history = useHistory()
  const network = useSelector((state: ApplicationState) => selectNetwork(state, networkID))
  const dispatch = useDispatch<Dispatch>()
  const disable = networkID === DEFAULT_ID || !network.id

  useEffect(() => {
    analyticsHelper.page('NetworkAddPage')
  }, [])

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>{network.name || 'Unknown Network'}</Title>
            {/* <AddUserButton to={`/devices/${device.id}/share`} hide={!device.permissions.includes('MANAGE')} /> */}
            <DeleteButton
              title="Delete Network"
              disabled={disable}
              warning={
                <>
                  <Notice severity="danger" fullWidth gutterBottom>
                    You will be permanently deleting <i>{network.name}. </i>
                  </Notice>
                  This will remove this network for you and all of the network's users.
                </>
              }
              onDelete={async () => {
                await dispatch.networks.deleteNetwork(network)
                history.push('/networks')
              }}
            />
          </Typography>
          <ListHorizontal>
            <ListItemLocation
              title="Edit"
              icon="pen"
              iconColor="grayDarker"
              pathname={`/networks/view/${network.id}/edit`}
              match={[`/networks/view/${network.id}`, `/networks/view/${network.id}/edit`]}
              dense
            />
            {/* <UsersSelect device={device} /> */}
          </ListHorizontal>
        </>
      }
    >
      <AccordionMenuItem gutters subtitle="Configuration" defaultExpanded elevation={0}>
        <NetworkSettings network={network} />
      </AccordionMenuItem>
    </Container>
  )
}
