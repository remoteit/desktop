import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { ApplicationState } from '../store'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { selectSessionUsers } from '../models/sessions'

export const ServiceUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const { service, connected } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, serviceID),
    service: device?.services.find(s => s.id === serviceID),
  }))
  const users = service?.access

  return (
    <ServiceHeaderMenu device={device} service={service}>
      <SharedUsersLists users={users} connected={connected} device={device} />
    </ServiceHeaderMenu>
  )
}
