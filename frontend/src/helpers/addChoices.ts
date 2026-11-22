import type { TFunction } from 'i18next'
import { DEVICE_SETUP_PATH } from '../constants'
import { platforms } from '../platforms'
import { devicePackagePath } from '../platforms/devicePackage'

export type RecommendedChoice = { id: string; icon: string; to?: string; title: string; line: string }

type Visitor = {
  os: string
  app: boolean // the desktop app, which sets up this computer on its own page
  registered: boolean // this computer is a device already
  devicePackage: boolean
  empty: boolean // the account has no devices yet
}

export const installPath = (id: string, devicePackage: boolean) =>
  devicePackage ? devicePackagePath(id) : platforms.get(id).route || `/add/${id}`

/** The first choices on the Add page, most likely first: this computer, a Linux device, Docker, and the demo device for an
 *  account with nothing in it yet. */
export function recommendedChoices(visitor: Visitor, t: TFunction): RecommendedChoice[] {
  const { os, app, registered, devicePackage, empty } = visitor
  const phone = os === 'ios' || os === 'android'
  const choices: RecommendedChoice[] = []
  if (!(app && registered) && os !== 'linux')
    choices.push({
      id: 'this',
      icon: os,
      to: app ? DEVICE_SETUP_PATH : installPath(os, devicePackage),
      title: phone
        ? t('addPage.thisPhone', 'This phone')
        : os === 'mac'
        ? t('addPage.thisMac', 'This Mac')
        : os === 'windows'
        ? t('addPage.thisPC', 'This PC')
        : t('addPage.thisComputer', 'This computer'),
      line: phone
        ? t('addPage.thisPhoneLine', 'Install the Remote.It app to reach your devices from this phone.')
        : t('addPage.thisComputerLine', 'Install the Remote.It app and reach this computer from anywhere.'),
    })
  choices.push({
    id: 'linux',
    icon: 'linux',
    to: app && os === 'linux' && !registered ? DEVICE_SETUP_PATH : installPath('linux', devicePackage),
    title:
      os === 'linux' && !phone
        ? t('addPage.thisOrLinux', 'This computer or a Linux device')
        : t('addPage.linuxDevice', 'A Linux device'),
    line: t('addPage.linuxLine', 'A Raspberry Pi, server or other Linux machine. One command to install.'),
  })
  choices.push({
    id: 'docker',
    icon: 'docker',
    to: installPath('docker', devicePackage),
    title: t('addPage.docker', 'Docker'),
    line: t('addPage.dockerLine', 'Run the agent as a container on any machine with Docker.'),
  })
  if (empty)
    choices.push({
      id: 'demo',
      icon: 'remoteit',
      title: t('addPage.tryDemo', 'Try a demo device'),
      line: t('addPage.demoLine', 'See how Remote.It works with a device we share with you.'),
    })
  return choices
}
