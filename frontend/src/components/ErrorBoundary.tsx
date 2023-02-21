import React, { Component, ErrorInfo } from 'react'
import { Store } from '../store'
import { AIRBRAKE_ID, AIRBRAKE_KEY } from '../shared/constants'
import { environment } from '../services/Browser'
import { Notifier } from '@airbrake/browser'
import { version } from '../helpers/versionHelper'
import '../styling/error.css'

type ErrorBoundaryProps = {
  store?: Store
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
  info?: ErrorInfo
  userId?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private airbrake = new Notifier({
    projectId: AIRBRAKE_ID,
    projectKey: AIRBRAKE_KEY,
    environment: environment(),
  })

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const userId = this.props.store?.getState().user.id

    this.setState({ hasError: true, error, info, userId })
    this.airbrake.notify({ error, params: { info }, context: { version, userId } })
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children}
          <div className="error">
            <div className="body">
              <h2>An error occurred!</h2>
              <p>
                <button
                  className="restart"
                  onClick={() => {
                    window.location.hash = ''
                    window.location.reload()
                  }}
                >
                  Restart
                </button>
              </p>
              <p>{this.state.userId && this.state.userId}</p>
              <p>{this.state.error && this.state.error.toString()}</p>
              {this.state.error && (
                <>
                  <h4>Stack trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                </>
              )}
              <button
                className="close"
                onClick={e => {
                  e.preventDefault()
                  this.setState({ hasError: false })
                }}
              >
                +
              </button>
            </div>
          </div>
        </>
      )
    }
    return this.props.children
  }
}
