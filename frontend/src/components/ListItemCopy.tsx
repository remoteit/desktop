import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { makeStyles, ListItemText, InputLabel } from '@material-ui/core'
import { useClipboard } from 'use-clipboard-copy'
import { colors } from '../styling'

export const ListItemCopy: React.FC<{ value: string; label: string }> = ({ value, label, children, ...props }) => {
  const css = useStyles()
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  return (
    <>
      <ListItemSetting
        icon={clipboard.copied ? 'check' : 'copy'}
        iconColor={clipboard.copied ? 'success' : undefined}
        tooltip={clipboard.copied ? 'Copied!' : label}
        label={
          <ListItemText>
            <InputLabel shrink>License Key</InputLabel>
            <pre className={css.key}>{value}</pre>
          </ListItemText>
        }
        onClick={clipboard.copy}
      />
      <input type="hidden" ref={clipboard.target} value={value} />
    </>
  )
}

const useStyles = makeStyles({
  key: { color: colors.grayDarker, margin: 0 },
})
