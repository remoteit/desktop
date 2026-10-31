import React from 'react'
import { Button } from '@mui/material'
import { Gutters } from '../../components/Gutters'
import { Notice } from '../../components/Notice'

type Props = { what: string; children: React.ReactNode }

/* A panel of the Upgrades page that throws while rendering says so, with the error, instead of leaving the panel blank
   or taking the app down: an answer from graphql this build did not expect should be visible to whoever is watching. */
export class UpgradesErrorBoundary extends React.Component<Props, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`Upgrades: the ${this.props.what} failed to render`, error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <Gutters>
        <Notice
          severity="error"
          fullWidth
          button={
            <Button size="small" color="error" onClick={() => this.setState({ error: undefined })}>
              Try again
            </Button>
          }
        >
          Could not show the {this.props.what}
          <em data-render-error>{this.state.error.message || String(this.state.error)}</em>
        </Notice>
      </Gutters>
    )
  }
}
