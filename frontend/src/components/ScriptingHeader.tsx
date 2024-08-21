import React from 'react'
import { Container } from './Container'
import { Stack, Button } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { DevicesActionBar } from './DevicesActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { Icon } from './Icon'

type Props = {
  children?: React.ReactNode
}

export const ScriptingHeader: React.FC<Props> = ({ children }) => {
  const location = useLocation()
  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBar displayOnly />
          <Stack flexDirection="row" justifyContent="space-between" alignItems="center" width="100%" paddingRight={4}>
            <ScriptingTabBar />
            <Button
              to="/scripting/scripts/new"
              size="small"
              variant="contained"
              color="primary"
              disabled={location.pathname.includes('new')}
              startIcon={<Icon name="plus" />}
              component={Link}
            >
              Add
            </Button>
          </Stack>
        </>
      }
    >
      {children}
    </Container>
  )
}
