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
            {network.permissions.includes('MANAGE') && (
              <>
                <AddUserButton to={`/networks/view/${network.id}/share`} />
                {network.shared ? (
                  <ConfirmButton
                    confirm
                    title="Leave network"
                    icon="arrow-right-from-bracket"
                    size="md"
                    confirmMessage={
                      <>
                        <Notice severity="danger" fullWidth gutterBottom>
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
                  <DeleteButton
                    title="Delete Network"
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
                )}
              </>
            )}
          </Typography>
          <NetworkTagEditor network={network} />
          <ListHorizontal>
            <ListItemLocation
              title="Edit"
              icon="pen"
              iconColor="grayDarker"
              pathname={`/networks/view/${network.id}/edit`}
              match={[`/networks/view/${network.id}`, `/networks/view/${network.id}/edit`]}
              exactMatch
              dense
            />
            <ListItemLocation
              pathname={`/networks/view/${network.id}/${network.access.length ? 'users' : 'share'}`}
              title={network.access.length ? 'Users' : 'Add User'}
              subtitle={network.access.length ? network.access.length + ' total' : ''}
              icon="user-group"
              iconColor="grayDarker"
              exactMatch
              dense
            />
          </ListHorizontal>
        </>
      }
    >
      {children}
    </Container>
  )
}
