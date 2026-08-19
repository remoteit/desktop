import { Theme } from '@mui/material/styles'

/* Slim, theme-matched scrollbars for the chat panel's scroll surfaces,
   replacing the default browser bars */
export const scrollbarStyles = (theme: Theme) => ({
  scrollbarWidth: 'thin' as const, // Firefox
  scrollbarColor: `${theme.palette.grayLight.main} transparent`, // Firefox
  '&::-webkit-scrollbar': { width: 8, height: 8, WebkitAppearance: 'none' as const },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 4,
    backgroundColor: theme.palette.grayLight.main,
    '&:hover': { backgroundColor: theme.palette.gray.main },
  },
  '&::-webkit-scrollbar-corner': { background: 'transparent' },
})
