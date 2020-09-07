import React, { useState, useEffect } from 'react'
import { MAX_NAME_LENGTH, REGEX_NAME_SAFE } from '../../shared/constants'
import { useHistory } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List, ListItem, Button } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { InlineTextFieldSetting } from '../../components/InlineTextFieldSetting'
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

  useEffect(() => {
    analyticsHelper.page('ServiceAddPage')
  }, [])

  const maxReached = targets.length + 1 > setupServicesLimit
  const disabled = setupBusy || !!error

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
        <>
          <List>
            <InlineTextFieldSetting
              value={target.name}
              label="Service Name"
              disabled={disabled}
              resetValue={DEFAULT_TARGET.name}
              maxLength={MAX_NAME_LENGTH}
              filter={REGEX_NAME_SAFE}
              onError={setError}
              onSave={name => {
                setTarget({ ...target, name: name.toString() })
              }}
            />
          </List>
          <Divider />
          <List>
            {/*  replaced with ServiceForm <ServiceSetting
              target={target}
              disabled={disabled}
              onUpdate={t => {
                console.log('UPDATE TARGET', t)
                setTarget({ ...t })
              }}
            /> */}
          </List>
          <Columns inset count={1}>
            <span>
              <Button
                onClick={() => backend.addTargetService(target)}
                variant="contained"
                color="primary"
                disabled={disabled}
              >
                Save
              </Button>
            </span>
          </Columns>
        </>
      )}
    </Container>
  )
}
