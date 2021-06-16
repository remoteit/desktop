import React from 'react'
import { makeStyles, ListItemText, IconButton, InputLabel, Tooltip } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../styling'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from './Icon'

export const ListItemCopy: React.FC<{ value?: string; label: string }> = ({ value, label, children, ...props }) => {
  const css = useStyles()
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!value) return null

  return (
    <Tooltip title={clipboard.copied ? 'Copied!' : `Copy ${label}`} enterDelay={500} placement="top" arrow>
      <IconButton className={css.box} onClick={clipboard.copy}>
        <Icon
          name={clipboard.copied ? 'check' : 'copy'}
          color={clipboard.copied ? 'success' : undefined}
          size="md"
          fixedWidth
        />
        <ListItemText>
          <InputLabel shrink>{label}</InputLabel>
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
    paddingLeft: spacing.xxs,
    paddingRight: spacing.lg,
    '& svg': { minWidth: 60 },
  },
  key: { fontSize: fontSizes.sm, color: colors.grayDarker, margin: 0 },
})
