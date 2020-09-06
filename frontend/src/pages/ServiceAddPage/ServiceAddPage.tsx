import React, { useState, useEffect } from 'react'
import { MAX_NAME_LENGTH, REGEX_NAME_SAFE } from '../../shared/constants'
import { useHistory, useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { ListItemSetting } from '../../components/ListItemSetting'
import { useSelector, useDispatch } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List, TextField, Button } from '@material-ui/core'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { InlineTextFieldSetting } from '../../components/InlineTextFieldSetting'
import { serviceNameValidation } from '../../shared/nameHelper'
import { ServiceSetting } from '../../components/ServiceSetting'
import { attributeName } from '../../shared/nameHelper'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const ServiceAddPage: React.FC<Props> = ({ targetDevice, targets }) => {
  const { setupBusy, setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const [error, setError] = useState<string>()
  const [target, setTarget] = useState<ITarget>(DEFAULT_TARGET)
  const { backend } = useDispatch<Dispatch>()
  const { deviceID } = useParams()
  const history = useHistory()

  useEffect(() => {
    analyticsHelper.page('ServiceAddPage')
  }, [])

  useEffect(() => {}, [setupBusy])

  const maxReached = targets.length + 1 > setupServicesLimit

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>Add service</Title>
          </Typography>
        </>
      }
    >
      {maxReached ? (
        <Typography variant="body2" color="textSecondary">
          Desktop currently supports a maximum of {setupServicesLimit} services.
        </Typography>
      ) : (
        <form
          onSubmit={() => {
            backend.addTargetService(target)
            history.push(`/devices/${deviceID}/edit`)
          }}
        >
          <List>
            <ListItemSetting
              label="Enable service"
              subLabel="Disabling your service will take it offline."
              icon="circle-check"
              toggle={!target.disabled}
              disabled={setupBusy}
              onClick={() => {
                setTarget({ ...target, disabled: !target.disabled })
              }}
            />
          </List>
          <Divider />
          <List>
            <ServiceSetting
              target={target}
              error={error}
              disabled={setupBusy}
              onUpdate={setTarget}
              onError={setError}
            />
          </List>
          <Columns inset count={1}>
            <span>
              <Button type="submit" variant="contained" color="primary" disabled={setupBusy || !!error}>
                Save
              </Button>
            </span>
          </Columns>
        </form>
      )}
    </Container>
  )
}
