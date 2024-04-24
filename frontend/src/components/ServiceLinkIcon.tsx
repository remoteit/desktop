import React from 'react'
import { Icon, IconProps } from './Icon'

type Props = IconProps & {
  service?: IService
}

export const ServiceLinkIcon: React.FC<Props> = ({ service, ...props }) =>
  service?.link?.enabled && <Icon name={service.link.web ? 'globe' : 'key'} {...props} />
