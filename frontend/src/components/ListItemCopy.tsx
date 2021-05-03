import React from 'react'
import { makeStyles, ListItemText, ListItem, ListItemIcon, IconButton, InputLabel, Tooltip } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../styling'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from './Icon'

export const ListItemCopy: React.FC<{ value?: string; label: string }> = ({ value, label, children, ...props }) => {
  const css = useStyles()
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!value) return null

  // <ListItemSetting
  //   onClick={clipboard.copy}
  // />
  // <input type="hidden" ref={clipboard.target} value={value} />
  return (
    <Tooltip title={clipboard.copied ? 'Copied!' : label} placement="top" arrow>
      <IconButton className={css.box} onClick={clipboard.copy}>
        <Icon
          name={clipboard.copied ? 'check' : 'copy'}
          color={clipboard.copied ? 'success' : undefined}
          size="md"
          fixedWidth
        />
        <ListItemText>
          <InputLabel shrink>License Key</InputLabel>
          <pre className={css.key}>{value}</pre>
        </ListItemText>
        <input type="hidden" ref={clipboard.target} value={value} />
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  box: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    marginLeft: -spacing.md,
    padding: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    '& svg': { marginRight: spacing.md },
  },
  key: { fontSize: fontSizes.sm, color: colors.grayDarker, margin: 0 },
})
