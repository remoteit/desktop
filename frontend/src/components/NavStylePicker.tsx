import React from 'react'
import { Box, ButtonBase, Tooltip } from '@mui/material'
import { NAV_STYLES, setNavStyle, setNavStylePickerHidden, useNavStyle } from '../helpers/navStyle'

const chip = {
  height: 16,
  paddingX: '5px',
  borderRadius: '8px',
  fontSize: 10,
  lineHeight: '16px',
  fontWeight: 500,
}

export const NavStylePicker: React.FC = () => {
  const { style, hidden } = useNavStyle()
  const current = NAV_STYLES.find(item => item.id === style)

  if (hidden)
    return (
      <Tooltip title="Show the sidebar style picker" placement="top" arrow>
        <ButtonBase
          onClick={() => setNavStylePickerHidden(false)}
          sx={theme => ({
            position: 'fixed',
            left: 0,
            bottom: 2,
            zIndex: 4,
            width: 14,
            height: 14,
            borderTopRightRadius: '7px',
            borderBottomRightRadius: '7px',
            fontSize: 9,
            color: theme.palette.grayDark.main,
            backgroundColor: theme.palette.grayLight.main,
            opacity: 0.7,
            '&:hover': { opacity: 1 },
          })}
        >
          ›
        </ButtonBase>
      </Tooltip>
    )

  return (
    <Box
      role="group"
      aria-label="Sidebar style"
      sx={theme => ({
        position: 'fixed',
        left: 6,
        right: 6,
        bottom: 2,
        zIndex: 4,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
        paddingX: '3px',
        borderRadius: '10px',
        backgroundColor: theme.palette.grayLight.main,
        color: theme.palette.grayDarker.main,
        opacity: 0.85,
        '&:hover': { opacity: 1 },
      })}
    >
      <Tooltip title={`Sidebar style: ${style.toUpperCase()} ${current?.label}`} placement="top" arrow>
        <Box component="span" sx={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', paddingX: '3px' }}>
          Style
        </Box>
      </Tooltip>
      {NAV_STYLES.map(item => (
        <Tooltip key={item.id} title={`${item.id.toUpperCase()} ${item.label}`} placement="top" arrow>
          <ButtonBase
            aria-label={`${item.id.toUpperCase()} ${item.label}`}
            aria-pressed={item.id === style}
            onClick={() => setNavStyle(item.id)}
            sx={theme => ({
              ...chip,
              color: item.id === style ? theme.palette.alwaysWhite.main : 'inherit',
              backgroundColor: item.id === style ? theme.palette.primary.main : 'transparent',
              '&:hover': { backgroundColor: item.id === style ? undefined : theme.palette.gray.main },
            })}
          >
            {item.id.toUpperCase()}
          </ButtonBase>
        </Tooltip>
      ))}
      <Tooltip title="Hide" placement="top" arrow>
        <ButtonBase
          aria-label="Hide the sidebar style picker"
          onClick={() => setNavStylePickerHidden(true)}
          sx={{ ...chip, marginLeft: 'auto', fontSize: 12 }}
        >
          ×
        </ButtonBase>
      </Tooltip>
    </Box>
  )
}
