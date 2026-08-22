import {render, screen} from '@testing-library/react'

import App from './app'

describe('App', () => {
  it('renders Hello World', () => {
    render(<App />)

    expect(screen.getByRole('heading', {name: 'Hello World (web)'})).toBeTruthy()
  })
})
