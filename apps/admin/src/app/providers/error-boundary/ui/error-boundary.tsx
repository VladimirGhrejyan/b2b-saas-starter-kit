import {Component, type ErrorInfo, type ReactNode} from 'react'

import {Button} from '@b2b-saas-starter-kit/ui-kit'

import type {ErrorBoundaryProps, ErrorBoundaryState} from '../model/error-boundary.types'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {error: null}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error}
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.logger.error(error.message, info.componentStack)
  }

  override render(): ReactNode {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <div>
        <h1>{this.props.i18n.t('errorTitle')}</h1>
        <Button type="button" onClick={this.retry}>
          {this.props.i18n.t('retry')}
        </Button>
        <Button type="button" onClick={this.reload}>
          {this.props.i18n.t('reload')}
        </Button>
      </div>
    )
  }

  private readonly retry = (): void => {
    this.setState({error: null})
  }

  private readonly reload = (): void => {
    globalThis.location.reload()
  }
}
