import {Environment} from './environment'
import type {ViteRuntimeFlags} from './environment.types'

const viteDev: ViteRuntimeFlags = {MODE: 'development', DEV: true, PROD: false}

describe('Environment', () => {
  it('exposes baked config and Vite runtime flags', () => {
    const environment = new Environment({env: 'development', apiBaseUrl: 'http://web.test/v1'}, viteDev)

    expect(environment.apiBaseUrl).toBe('http://web.test/v1')
    expect(environment.appEnv).toBe('development')
    expect(environment.mode).toBe('development')
    expect(environment.isDev).toBe(true)
    expect(environment.isProd).toBe(false)
    expect(environment.isStaging).toBe(false)
    expect(environment.isProduction).toBe(false)
  })

  it('treats staging and production as deploy env, not Vite mode', () => {
    const staging = new Environment(
      {env: 'staging', apiBaseUrl: 'https://staging.example/v1'},
      {MODE: 'production', DEV: false, PROD: true},
    )

    expect(staging.isProd).toBe(true)
    expect(staging.isStaging).toBe(true)
    expect(staging.isProduction).toBe(false)

    const production = new Environment(
      {env: 'production', apiBaseUrl: 'https://api.example/v1'},
      {MODE: 'production', DEV: false, PROD: true},
    )

    expect(production.isProduction).toBe(true)
    expect(production.isStaging).toBe(false)
  })
})
