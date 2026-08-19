import React from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { NoConnectionPage } from './NoConnectionPage'
import { Typography, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectOrganizationName } from '../selectors/organizations'
import { networkAttributes } from '../components/Attributes'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { NetworkSettings } from '../components/NetworkSettings'
import { DataDisplay } from '../components/DataDisplay'
import { GuideStep } from '../components/GuideStep'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

export const NetworkPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { network } = React.useContext(DeviceContext)
  const { orgName, email } = useSelector((state: State) => ({
    orgName: selectOrganizationName(state, network?.owner.id),
    email: state.user.email,
  }))
  const { t } = useTranslation()

  if (!network) return <NoConnectionPage />
  const empty = network.serviceIds.length === 0

  return (
    <GuideStep
      step={3}
      guide="network"
      instructions={
        <>
          <Typography variant="body1" gutterBottom>
            {t('networkPage.networkAdded', 'Network added!')}
          </Typography>
          <Typography variant="body2">
            {t(
              'networkPage.nextAddService',
              'Next add a service. Find one from the devices page and use the network panel to add.'
            )}
          </Typography>
          <Typography variant="caption">
            {t('networkPage.ownOrManageNote', 'Note, you can only add from devices you own or manage.')}
          </Typography>
        </>
      }
      placement="left"
      hideArrow
      autoNext
    >
      <NetworkHeaderMenu network={network} email={email}>
        {empty && (
          <Notice gutterTop>
            {t('networkPage.emptyNetwork', 'Empty network')}{' '}
            <em>{t('networkPage.addServicesHint', 'Add services to this network from a service page')}</em>
          </Notice>
        )}
        <Typography variant="subtitle1">{t('networkPage.connections', 'Connections')}</Typography>
        <Gutters bottom="xxl">
          <Button
            variant="contained"
            size="small"
            disabled={empty}
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: true })}
          >
            {t('networkPage.startAll', 'Start All')}
          </Button>
          <Button
            variant="contained"
            color="info"
            size="small"
            disabled={empty}
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: false })}
            sx={{ marginLeft: 1 }}
          >
            {t('networkPage.stopAll', 'Stop All')}
          </Button>
        </Gutters>
        <Typography variant="subtitle1">{t('networkPage.settings', 'Settings')}</Typography>
        <NetworkSettings network={network} orgName={orgName} />
        <Gutters>
          <DataDisplay attributes={networkAttributes} instance={network} />
        </Gutters>
      </NetworkHeaderMenu>
    </GuideStep>
  )
}
