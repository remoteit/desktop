import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Divider, IconButton, Menu } from '@material-ui/core'
import { DeleteButton } from '../buttons/DeleteButton'
import { ListItemLocation } from './ListItemLocation'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = { organization: ApplicationState['IOrganizationState'] }

export const OrganizationOptionMenu: React.FC<Props> = ({ organization }) => {
  const samlFeature = useSelector((state: ApplicationState) => state.ui.feature.saml)
  const [removing, setRemoving] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const dispatch = useDispatch<Dispatch>()
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <IconButton onClick={handleClick}>
        <Icon name="ellipsis-v" size="md" fixedWidth />
      </IconButton>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        autoFocus={false}
      >
        <div>
          {samlFeature && (
            <>
              <ListItemLocation
                title="Settings"
                icon="sliders-h"
                pathname="/account/organization/saml"
                disableGutters
                dense
              />
              <ListItemLocation
                title="Roles"
                icon="shield-alt"
                pathname={`/account/organization/roles/${organization.roles[0].id}`}
                disableGutters
                dense
              />
              <Divider />
            </>
          )}
          <DeleteButton
            menuItem
            title="Delete Organization"
            destroying={removing}
            warning={
              <>
                <Notice severity="danger" fullWidth gutterBottom>
                  You will be permanently deleting <i>{organization.name}. </i>
                </Notice>
                This will remove all your members and their access to your devices.
              </>
            }
            onDelete={() => {
              setRemoving(true)
              dispatch.organization.removeOrganization()
            }}
          />
        </div>
      </Menu>
    </>
  )
}
