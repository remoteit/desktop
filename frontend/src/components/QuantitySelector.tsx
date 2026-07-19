import React from 'react'
import { Box, TextField, Button } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { Icon } from './Icon'

type Props = {
  quantity: number
  onChange: (quantity: number) => void
}

export const QuantitySelector: React.FC<Props> = ({ quantity, onChange }) => {
  const setQuantity = (value: number) => {
    let result = Math.ceil(Math.max(Math.min(+value, 9999), 0))
    if (isNaN(result)) result = 1
    onChange(result)
  }

  return (
    <Box
      sx={theme => ({
        border: `1px solid ${theme.palette.grayLighter.main}`,
        borderRadius: `${spacing.md}px`,
        backgroundColor: theme.palette.white.main,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: `${spacing.xs}px`,
        marginBottom: `${spacing.xs}px`,
        '& > .MuiButton-root': { height: 30, borderRadius: 0 },
        '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
        '& > .MuiButton-root:first-of-type': {
          borderTopLeftRadius: `${spacing.md}px`,
          borderBottomLeftRadius: `${spacing.md}px`,
        },
        '& > .MuiButton-root:last-child': {
          borderTopRightRadius: `${spacing.md}px`,
          borderBottomRightRadius: `${spacing.md}px`,
        },
      })}
    >
      <Button
        sx={{ padding: 0 }}
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
        sx={{
          maxWidth: 60,
          '& .MuiInputBase-input': {
            height: `${spacing.sm}px`,
            fontSize: fontSizes.base,
            fontWeight: 500,
            padding: `${spacing.xs}px`,
            textAlign: 'center',
            margin: 0,
          },
        }}
      />
      <Button
        sx={{ padding: 0 }}
        size="small"
        variant="contained"
        color="primary"
        onClick={() => setQuantity(quantity + 1)}
      >
        <Icon name="plus" size="sm" />
      </Button>
    </Box>
  )
}

