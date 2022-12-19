import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { AccordionMenuItem } from '../../components/AccordionMenuItem'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { ListItemBack } from '../../components/ListItemBack'
import { ServiceForm } from '../../components/ServiceForm'
import { Gutters } from '../../components/Gutters'

type Props = { device?: IDevice }

export const ServiceEditPage: React.FC<Props> = ({ device }) => {
  const { thisId } = useSelector((state: ApplicationState) => state.backend)
  const { devices, applicationTypes } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const thisDevice = service?.deviceID === thisId
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
  }, [])

  if (!service) {
    history.push(`/devices/${device?.id}`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))

  return (
    <>
      <Gutters size="md" bottom={null}>
        <ListItemBack title="Service configuration" />
        <AccordionMenuItem gutters subtitle="Service Setup" defaultExpanded>
          <ServiceForm
            service={service}
            thisDevice={thisDevice}
            editable={!!device?.configurable || thisDevice}
            disabled={!device?.permissions.includes('MANAGE')}
            onCancel={exit}
            onSubmit={async form => {
              if (device?.permissions.includes('MANAGE')) {
                service.attributes = { ...service.attributes, ...form.attributes }
                await devices.setServiceAttributes(service)
                if (device?.configurable) await devices.cloudUpdateService({ form, deviceId: device?.id })
              }
            }}
          />
        </AccordionMenuItem>
      </Gutters>
    </>
  )
}
