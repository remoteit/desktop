import React from 'react'
import browser from '../services/browser'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'
import { emit } from '../services/Controller'

export const DragAppRegion: React.FC = () => {
  const css = useStyles()
  if (!browser.isElectron || !browser.isMac) return null
  return <div className={css.drag} onDoubleClick={() => emit('maximize')} />
}

const useStyles = makeStyles({
  drag: {
    left: 0,
    top: 0,
    right: 0,
    height: spacing.xxl,
    position: 'absolute',
    // WebkitAppRegion: 'drag', - handled in index.css
    // backgroundColor: 'rgba(255,0,0,0.2)',
  },
})
