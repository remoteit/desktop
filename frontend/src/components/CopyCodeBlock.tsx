import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Stack, Paper, PaperProps, Typography } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'

type Props = PaperProps & {
  value?: string
  code?: string
  label?: string
  link?: string
  hideCopyLabel?: boolean
}

export const CopyCodeBlock: React.FC<Props> = ({ value, code, label, hideCopyLabel, link, ...props }) => {
  const css = useStyles()

  if (!value) return null

  return (
    <Paper elevation={0} className={css.paper} {...props}>
      <Stack
        flexGrow={1}
        justifyContent="center"
        flexDirection="column"
        alignItems="flex-start"
        padding={2}
        paddingLeft={3}
      >
        {label && <Typography variant="h5">{label}</Typography>}
        <Typography className={css.key} variant="h4">
          {value}
        </Typography>
      </Stack>
      {(code || value) && (
        <Box className={css.icons}>
          {!hideCopyLabel && (
            <Typography variant="h5" marginTop={1}>
              Copy
            </Typography>
          )}
          {value && (
            <CopyIconButton
              size="base"
              value={value}
              placement="left"
              variant="text"
              icon={code ? 'command' : 'clone'}
              type="regular"
              title="Copy command"
            />
          )}
          {code && (
            <CopyIconButton
              size="base"
              value={code}
              placement="left"
              variant="text"
              type="regular"
              icon={code === value ? 'copy' : 'barcode'}
              title="Copy code"
            />
          )}
        </Box>
      )}
      {link && (
        <IconButton
          fixedWidth
          size="xl"
          icon="launch"
          color="primary"
          variant="contained"
          onClick={() => (window.location.href = link)}
          className={css.button}
        />
      )}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  icons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.xs,
    borderLeft: `1px solid ${palette.grayLighter.main}`,
    '& .MuiTypography-root': { marginBottom: spacing.xxs },
    '& span': { marginRight: spacing.xs, marginLeft: spacing.xs },
    '& span + span': { marginTop: -spacing.xs },
  },
  paper: {
    display: 'flex',
    backgroundColor: palette.grayLightest.main,
    minWidth: 200,
  },
  button: {
    width: 64,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  key: {
    fontSize: fontSizes.sm,
    color: palette.grayDarker.main,
    marginTop: 2,
    marginBottom: 2,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}))
