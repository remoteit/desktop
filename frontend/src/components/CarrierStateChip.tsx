import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ExitDevice, ProxyDevice } from '../services/graphQLDeviceRuns'
import { carrierColor, carrierState } from '../helpers/exitWords'
import { ColorChip } from './ColorChip'

export const CarrierStateChip: React.FC<{ run: ExitDevice | ProxyDevice }> = ({ run }) => {
  const { t } = useTranslation()
  return <ColorChip size="small" label={carrierState(t, run)} color={carrierColor(run)} data-run-state />
}
