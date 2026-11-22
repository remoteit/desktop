import type { TFunction } from 'i18next'
import { DeviceNetwork, NetworkRule, deviceCount, peopleCount, ruleReachedOf } from '../services/graphQLDeviceNetworks'

export const devicesText = (t: TFunction, count: number) =>
  count === 1
    ? t('deviceNetwork.oneDevice', '1 device')
    : t('deviceNetwork.devicesCount', '{{count}} devices', { count })

export const peopleText = (t: TFunction, count: number) =>
  count === 1 ? t('deviceNetwork.onePerson', '1 person') : t('deviceNetwork.peopleCount', '{{count}} people', { count })

export const networkSummary = (
  t: TFunction,
  network: Pick<DeviceNetwork, 'devices' | 'deviceRules' | 'owner' | 'access' | 'accountAccess'>
) => {
  const devices = deviceCount(network)
  return [
    devices ? devicesText(t, devices) : t('deviceNetworks.noDevices', 'No devices yet'),
    peopleText(t, peopleCount(network)),
  ].join(' · ')
}

export const tagsText = (t: TFunction, rule: Pick<NetworkRule, 'tags' | 'operator'>) =>
  rule.tags.join(rule.operator === 'ALL' ? t('deviceNetwork.tagsAnd', ' and ') : t('deviceNetwork.tagsOr', ' or '))

export const taggedText = (t: TFunction, rule: Pick<NetworkRule, 'tags' | 'operator'>) =>
  t('deviceNetwork.devicesTagged', 'Devices tagged {{tags}}', { tags: tagsText(t, rule) })

export const ruleSentence = (
  t: TFunction,
  rule: Pick<NetworkRule, 'tags' | 'operator' | 'initiator' | 'allServices' | 'anyPort'>
) => {
  const who = taggedText(t, rule)
  const reached = ruleReachedOf(rule)
  const how =
    reached === 'ALL_ANY_PORT'
      ? t('deviceNetwork.howAllAnyPort', 'all services and any port')
      : t('deviceNetwork.howAll', 'all services')
  if (rule.initiator && reached !== 'NOTHING')
    return t('deviceNetwork.ruleBoth', '{{who}} can reach this network and can be reached: {{how}}.', { who, how })
  if (rule.initiator) return t('deviceNetwork.ruleReach', '{{who}} can reach this network.', { who })
  if (reached !== 'NOTHING') return t('deviceNetwork.ruleReached', '{{who}} can be reached: {{how}}.', { who, how })
  return t('deviceNetwork.ruleNothing', '{{who}} are on this network, but can’t reach or be reached yet.', { who })
}
