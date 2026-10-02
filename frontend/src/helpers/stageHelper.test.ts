import { describe, it, expect, vi, afterEach } from 'vitest'
import { chooseStage, reloadIfStageChanged, stageChanged } from './stageHelper'
import { DEFAULT_STAGE, STAGE } from '../constants'

describe('stageHelper', () => {
  afterEach(() => window.localStorage.clear())

  it('runs on the default stage of this version with nothing stored', () => {
    expect(STAGE).toBe(DEFAULT_STAGE)
    expect(stageChanged()).toBe(false)
  })

  it('stores only a choice that differs from the default', () => {
    const other = DEFAULT_STAGE === 'prod' ? 'dev' : 'prod'
    chooseStage(other)
    expect(window.localStorage.getItem('r3.stage')).toBe(other)
    chooseStage(DEFAULT_STAGE)
    expect(window.localStorage.getItem('r3.stage')).toBeNull()
  })

  it('reloads only when the chosen stage differs from the running one', () => {
    const reload = vi.fn()
    reloadIfStageChanged(reload)
    expect(reload).not.toHaveBeenCalled()
    chooseStage(DEFAULT_STAGE === 'prod' ? 'dev' : 'prod')
    reloadIfStageChanged(reload)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
