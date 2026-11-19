import { execFile } from 'child_process'
import Logger from './Logger'
import os from 'os'

type Adapter = { Name: string; NdisPhysicalMedium?: number }
type Route = { InterfaceAlias: string; NextHop?: string; RouteMetric?: number; InterfaceMetric?: number }
type Details = { adapters: Adapter[]; routes: Route[] }

const NDIS_PHYSICAL_MEDIUM_NATIVE_802_11 = 9

// Adapter names reach us through the console code page unless stdout is switched to UTF-8,
// and they must match os.networkInterfaces() keys byte for byte (e.g. Japanese "イーサネット").
const SCRIPT =
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8; ' +
  'ConvertTo-Json -Compress -Depth 4 -InputObject @{ ' +
  'adapters = @(Get-NetAdapter | Select-Object Name, NdisPhysicalMedium); ' +
  'routes = @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix 0.0.0.0/0 -ErrorAction SilentlyContinue | ' +
  'Select-Object InterfaceAlias, NextHop, RouteMetric, InterfaceMetric) }'

export default async function windowsInterfaces(): Promise<IInterface[]> {
  const { adapters, routes } = await details()
  routes.sort((a, b) => metric(a) - metric(b))

  return Object.entries(os.networkInterfaces()).flatMap(([name, addresses = []]) => {
    const ipv4 = addresses.find(address => address.family === 'IPv4' && !address.internal)
    if (!ipv4) return []
    const adapter = adapters.find(a => a.Name === name)
    return {
      active: name === routes[0]?.InterfaceAlias,
      gateway: routes.find(r => r.InterfaceAlias === name)?.NextHop,
      ip: ipv4.address,
      mac: ipv4.mac,
      netmask: ipv4.netmask,
      name,
      type: adapter?.NdisPhysicalMedium === NDIS_PHYSICAL_MEDIUM_NATIVE_802_11 ? 'Wireless' : 'Wired',
    }
  })
}

function metric(route: Route) {
  return (route.RouteMetric || 0) + (route.InterfaceMetric || 0)
}

async function details(): Promise<Details> {
  try {
    const { adapters, routes } = JSON.parse(await powershell(SCRIPT))
    return { adapters: adapters || [], routes: routes || [] }
  } catch (error) {
    Logger.warn('INTERFACE details unavailable', { error })
    return { adapters: [], routes: [] }
  }
}

function powershell(script: string) {
  return new Promise<string>((resolve, reject) =>
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 30000, windowsHide: true },
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    )
  )
}
