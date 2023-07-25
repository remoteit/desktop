import React from 'react'
import { makeStyles } from '@mui/styles'
import { useClipboard } from 'use-clipboard-copy'
import { ListItemButton, DataButtonProps } from '../buttons/ListItemButton'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'

type Props = Omit<DataButtonProps, 'title' | 'onClick' | 'icon'> & {
  hideIcon?: boolean
  link?: string
}

export const ListItemCopy: React.FC<Props> = ({ hideIcon, link, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const css = useStyles()

  if (!props.value) return null

  return (
    <>
      <ListItemButton
        {...props}
        title={clipboard.copied ? 'Copied!' : props.label ? `Copy ${props.label}` : 'Copy'}
        icon={hideIcon ? null : clipboard.copied ? 'check' : 'clone'}
        iconColor={clipboard.copied ? 'success' : undefined}
        onClick={clipboard.copy}
        action={
          link ? (
            <IconButton
              size="xl"
              icon="launch"
              color="primary"
              variant="contained"
              onClick={() => (window.location.href = link)}
              className={css.button}
            />
          ) : undefined
        }
      />
      <input type="hidden" ref={clipboard.target} value={props.value} />
    </>
  )
}

const useStyles = makeStyles(() => ({
  button: {
    minHeight: 80,
    width: 80,
    marginRight: -spacing.xxl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
}))
