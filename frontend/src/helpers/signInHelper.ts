import type { DeviceSignIn } from '../services/deviceSignIns'

// The sign-in on the account an OS name says, as a choice made on the device names it — "pat", or "DESKTOP-7\pat" on
// Windows, where either side may say the domain. None for a name no sign-in's account has.
export function signInByName(signIns: DeviceSignIn[] | null | undefined, name: string | null | undefined) {
  if (!signIns || !name) return undefined
  const bare = (value: string) => value.toLowerCase().split('\\').pop()
  return (
    signIns.find(signIn => signIn.name?.toLowerCase() === name.toLowerCase()) ??
    signIns.find(signIn => signIn.name && bare(signIn.name) === bare(name))
  )
}

// A person as a line names them.
export const personName = (signIn?: DeviceSignIn) => signIn?.person?.email || signIn?.name || undefined
