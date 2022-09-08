import React from 'react'
import { makeStyles } from '@mui/styles'
import { TextField, Button } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { Icon } from './Icon'

type Props = {
  quantity: number
  onChange: (quantity: number) => void
}

export const QuantitySelector: React.FC<Props> = ({ quantity, onChange }) => {
  const css = useStyles()

  const setQuantity = (value: number) => {
    let result = Math.ceil(Math.max(Math.min(+value, 9999), 0))
    if (isNaN(result)) result = 1
    onChange(result)
  }

  return (
    <div className={css.group}>
      <Button
        className={css.button}
        size="small"
        variant="contained"
        color="primary"
        onClick={() => setQuantity(quantity - 1)}
      >
        <Icon name="minus" size="sm" />
      </Button>
      <TextField
        hiddenLabel
        variant="standard"
        size="small"
        value={quantity}
        color="primary"
        onChange={e => setQuantity(+e.target.value)}
        className={css.quantity}
      />
      <Button
        className={css.button}
        size="small"
        variant="contained"
        color="primary"
        onClick={() => setQuantity(quantity + 1)}
      >
        <Icon name="plus" size="sm" />
      </Button>
    </div>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  group: {
    border: `1px solid ${palette.grayLighter.main}`,
    borderRadius: spacing.md,
    backgroundColor: palette.white.main,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& > .MuiButton-root': { height: 30, borderRadius: 0 },
    '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
    '& > .MuiButton-root:first-of-type': { borderTopLeftRadius: spacing.md, borderBottomLeftRadius: spacing.md },
    '& > .MuiButton-root:last-child': { borderTopRightRadius: spacing.md, borderBottomRightRadius: spacing.md },
  },
  button: {
    padding: 0,
  },
  quantity: {
    maxWidth: 60,
    '& .MuiInputBase-input': {
      height: spacing.sm,
      fontSize: fontSizes.base,
      fontWeight: 500,
      padding: spacing.xs,
      textAlign: 'center',
      margin: 0,
    },
  },
}))
