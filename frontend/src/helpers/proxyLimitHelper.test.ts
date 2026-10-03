import { describe, expect, it } from 'vitest'
import { ProxyLimits, cellLabel, valueLabel } from './proxyLimitHelper'

const limits: ProxyLimits = {
  names: ['proxy-rate', 'proxy-transfer', 'proxy-exit'],
  plans: ['BUSINESS', 'ENTERPRISE', 'PERSONAL'],
  rows: [
    { plan: null, name: 'proxy-rate', value: 5, scale: null },
    { plan: null, name: 'proxy-exit', value: 0, scale: null },
    { plan: 'BUSINESS', name: 'proxy-rate', value: 100, scale: null },
    { plan: 'BUSINESS', name: 'proxy-transfer', value: 0, scale: 250 },
    { plan: 'BUSINESS', name: 'proxy-exit', value: 1, scale: null },
    { plan: 'ENTERPRISE', name: 'proxy-rate', value: null, scale: null },
  ],
}

describe('the plans’ limits as read', () => {
  it('a plan’s own row', () => {
    expect(cellLabel(limits, 'BUSINESS', 'proxy-rate')).toEqual({ text: '100', inherited: false })
    expect(cellLabel(limits, 'BUSINESS', 'proxy-transfer').text).toBe('0 + 250 a license')
    expect(cellLabel(limits, 'BUSINESS', 'proxy-exit').text).toBe('on')
  })

  it('an empty value is no limit, apart from having no row', () => {
    expect(cellLabel(limits, 'ENTERPRISE', 'proxy-rate')).toEqual({ text: 'no limit', inherited: false })
    expect(cellLabel(limits, 'PERSONAL', 'proxy-rate')).toEqual({ text: 'default (5)', inherited: true })
    expect(cellLabel(limits, 'PERSONAL', 'proxy-exit').text).toBe('default (off)')
  })

  it('a limit the default has no row for is no limit', () => {
    expect(cellLabel(limits, 'PERSONAL', 'proxy-transfer')).toEqual({ text: 'no limit', inherited: true })
    expect(cellLabel(limits, null, 'proxy-transfer')).toEqual({ text: 'no limit', inherited: true })
  })

  it('values', () => {
    expect(valueLabel('exit-rate', 50, null)).toBe('50')
    expect(valueLabel('exit-rate', null, null)).toBe('no limit')
  })
})
