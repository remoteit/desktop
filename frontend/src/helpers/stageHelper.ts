import { DEFAULT_STAGE, STAGE, STAGE_KEY, STAGE_PINNED, StageName, readStage } from '../constants'

// Stored only when it differs from the version's default, so an untouched install follows the build.
export function chooseStage(stage: StageName) {
  if (stage === DEFAULT_STAGE) window.localStorage.removeItem(STAGE_KEY)
  else window.localStorage.setItem(STAGE_KEY, stage)
}

export const stageChanged = (): boolean => !STAGE_PINNED && readStage() !== STAGE

export function reloadIfStageChanged(reload = () => window.location.reload()) {
  if (stageChanged()) reload()
}
