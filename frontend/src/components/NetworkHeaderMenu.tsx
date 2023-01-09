import React from 'react'
import { Typography } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { NetworkTagEditor } from '../components/NetworkTagEditor'
import { ListHorizontal } from '../components/ListHorizontal'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { UsersTab } from '../components/UsersTab'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const NetworkHeaderMenu: React.FC<{ network: INetwork; email: string; children: React.ReactNode }> = ({
  network,
  email,
  children,
}) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{network.name || 'Unknown Network'}</Title>
            {network.shared ? (
              <ConfirmButton
                confirm
                title="Leave network"
                icon="arrow-right-from-bracket"
                size="md"
                confirmMessage={
                  <>
                    <Notice severity="error" fullWidth gutterBottom>
                      You will be leaving <i>{network.name}. </i>
                    </Notice>
                    The network will have to be re-shared to you if you wish to access it again.
                  </>
                }
                onClick={async () => {
                  await dispatch.networks.unshareNetwork({ networkId: network.id, email })
                  history.push('/networks')
                }}
              />
            ) : (
              network.permissions.includes('MANAGE') && (
                <>
                  <AddUserButton to={`/networks/${network.id}/share`} title="Share access" />
                  <DeleteButton
                    title="Delete Network"
                    warning={
                      <>
                        <Notice severity="error" fullWidth gutterBottom>
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
                </>
              )
            )}
          </Typography>
          <NetworkTagEditor network={network} />
          <ListHorizontal dense>
            <ListItemLocation
              title="Details"
              icon="circle-info"
              iconColor="grayDarker"
              pathname={`/networks/${network.id}`}
              exactMatch
              dense
            />
            <UsersTab instance={network} to={`/networks/${network.id}/users`} />
          </ListHorizontal>
        </>
      }
    >
      {children}
    </Container>
  )
}
