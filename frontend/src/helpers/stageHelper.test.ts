import { describe, it, expect, vi, afterEach } from 'vitest'
import { chooseStage, reloadIfStageChanged } from './stageHelper'
import { DEFAULT_STAGE, STAGE } from '../constants'

describe('stageHelper', () => {
  const other = DEFAULT_STAGE === 'prod' ? 'dev' : 'prod'
  afterEach(() => window.localStorage.clear())

  it('stores only a choice that differs from the default', () => {
    chooseStage(other)
    expect(window.localStorage.getItem('r3.stage')).toBe(other)
    chooseStage(DEFAULT_STAGE)
    expect(window.localStorage.getItem('r3.stage')).toBeNull()
  })

  it('reloads only when the chosen stage differs from the running one', () => {
    expect(STAGE).toBe(DEFAULT_STAGE)
    const reload = vi.fn()
    reloadIfStageChanged(reload)
    expect(reload).not.toHaveBeenCalled()
    chooseStage(other)
    reloadIfStageChanged(reload)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
