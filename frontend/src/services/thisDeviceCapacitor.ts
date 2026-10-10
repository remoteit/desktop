/* thisDevice on a phone: the Capacitor shell's ThisDevice plugin (device-package mobile/, docs/one-app-plan.md), the
   transport thisDevice.ts describes — `call({ method, args })` resolving to `{ result }` or rejecting with the error's
   code, and every event through one `addListener('event', { name, payload })`. Registered at boot only in a native
   Capacitor app that has the plugin: the prod mobile app and a plain browser have none, and thisDevice is absent. */

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import {
  BridgeError,
  registerBridgeTransport,
  type BridgeErrorCode,
  type BridgeEvent,
  type BridgeEvents,
  type BridgeTransport,
} from './thisDevice'

export const PLUGIN_NAME = 'ThisDevice'

type NativeEvent = { name: string; payload: unknown }

export interface ThisDevicePlugin {
  call(options: { method: string; args: object }): Promise<{ result: unknown }>
  addListener(eventName: 'event', listener: (event: NativeEvent) => void): Promise<PluginListenerHandle>
}

const CODES: BridgeErrorCode[] = ['unsupported', 'notSignedIn', 'refused', 'busy', 'unavailable', 'cancelled', 'failed']

// A rejection as the bridge says it: the plugin rejects with a BridgeErrorCode as its code; anything else (Capacitor's
// own "not implemented", a crash in the shell) is 'failed', or 'unsupported' where Capacitor says the method is missing.
export function bridgeError(error: any): BridgeError {
  const code = error?.code
  if (CODES.includes(code)) return new BridgeError(code, error?.message)
  if (code === 'UNIMPLEMENTED') return new BridgeError('unsupported', error?.message)
  return new BridgeError('failed', error?.message || String(error))
}

export function capacitorTransport(plugin: ThisDevicePlugin): BridgeTransport {
  const listeners = new Map<string, Set<(payload: any) => void>>()
  // One native listener for every event, added with the first subscriber and kept: the plugin's events are few.
  let native: Promise<PluginListenerHandle> | undefined

  return {
    async call(method, args) {
      try {
        const answer = await plugin.call({ method, args: args ?? {} })
        return answer?.result as any
      } catch (error) {
        throw bridgeError(error)
      }
    },

    on<E extends BridgeEvent>(event: E, listener: (payload: BridgeEvents[E]) => void) {
      if (!native) {
        native = plugin.addListener('event', ({ name, payload }) => {
          listeners.get(name)?.forEach(l => l(payload))
        })
      }
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(listener)
      return () => {
        listeners.get(event)?.delete(listener)
      }
    },
  }
}

// At boot: a native platform with the plugin registered by the shell, or nothing.
export function registerCapacitorBridge() {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable(PLUGIN_NAME)) return false
  const plugin = registerPlugin<ThisDevicePlugin>(PLUGIN_NAME)
  registerBridgeTransport(async () => capacitorTransport(plugin))
  return true
}
