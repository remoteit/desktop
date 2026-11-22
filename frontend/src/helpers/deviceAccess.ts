// Access over two device settings: Off = subnet off; Networks only = subnet on; Full access = subnet on and user mode
// acting for you. User mode with the subnet off does nothing: it reads Off, dormant, and any level clears it.
export type AccessLevel = 'off' | 'networks' | 'full'
export const ACCESS_LEVELS: AccessLevel[] = ['off', 'networks', 'full']

export type AccessReading = { subnet: boolean; actsFor: string | null }
export type AccessStep = { setting: 'subnet' | 'user_mode'; on: boolean }
export type AccessLocks = { subnet?: boolean; userMode?: boolean }

export function accessLevel({ subnet, actsFor }: AccessReading): AccessLevel {
  if (!subnet) return 'off'
  return actsFor ? 'full' : 'networks'
}

export const accessDormant = ({ subnet, actsFor }: AccessReading) => !subnet && !!actsFor

// The changes, in order, that take the device from what it reads to a level. User mode leaves before the subnet goes
// off, and the subnet comes on before user mode, so the device never holds user mode without its subnet on our account.
export function accessSteps(current: AccessReading, me: string | undefined, to: AccessLevel): AccessStep[] {
  const steps: AccessStep[] = []
  const subnet = to !== 'off'
  const userMode = to === 'full'
  if (current.actsFor && (!userMode || current.actsFor !== me)) steps.push({ setting: 'user_mode', on: false })
  if (current.subnet !== subnet) steps.push({ setting: 'subnet', on: subnet })
  if (userMode && current.actsFor !== me) steps.push({ setting: 'user_mode', on: true })
  // Off then on again makes user mode act for you: one call does it.
  return steps.filter(
    (step, index) =>
      !(step.setting === 'user_mode' && !step.on && steps.some((s, i) => i > index && s.setting === 'user_mode'))
  )
}

// Whether a level needs a change the device's administrator, the device itself or a product holds.
export function accessBlocked(current: AccessReading, me: string | undefined, to: AccessLevel, locks: AccessLocks) {
  return accessSteps(current, me, to).some(step =>
    step.setting === 'subnet' ? !!locks.subnet : !!locks.userMode && step.on
  )
}
