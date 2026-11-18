import React, { Component, ErrorInfo } from 'react'
import { AIRBRAKE_ID, AIRBRAKE_KEY } from '../constants'
import { INotice, Notifier } from '@airbrake/browser'
import { version } from '../helpers/versionHelper'
import { Store } from '../store'
import browser from '../services/browser'

// A sign-in callback's URL carries the OAuth code and state, and Airbrake reports the page URL and its navigation history.
const OAUTH_PARAMS = /([?&](?:code|state)=)[^&#]*/g
const redact = (value: unknown) => (typeof value === 'string' ? value.replace(OAUTH_PARAMS, '$1[redacted]') : value)

export function redactOAuthParams(notice: INotice) {
  if (!notice.context) return notice
  notice.context = {
    ...notice.context,
    url: redact(notice.context.url),
    history: notice.context.history?.map((entry: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(entry).map(([key, value]) => [key, redact(value)]))
    ),
  }
  return notice
}

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
    environment: browser.environment(),
  })

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
    this.airbrake.addFilter(redactOAuthParams)
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
