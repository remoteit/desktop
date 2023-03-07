import React from 'react'
import { makeStyles } from '@mui/styles'
import { isElectron, isMac } from '../services/Browser'
import { spacing } from '../styling'
import { emit } from '../services/Controller'

export const DragAppRegion: React.FC = () => {
  const css = useStyles()
  if (!isElectron() || !isMac()) return null
  return <div className={css.drag} onDoubleClick={() => emit('maximize')} />
}

const useStyles = makeStyles({
  drag: {
    left: 0,
    top: 0,
    right: 0,
    height: spacing.xxl,
    position: 'absolute',
    WebkitAppRegion: 'drag',
    // backgroundColor: 'rgba(255,0,0,0.2)',
  },
})
