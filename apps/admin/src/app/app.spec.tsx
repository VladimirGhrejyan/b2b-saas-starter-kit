import {screen} from '@testing-library/react'

import {HomePage} from '@/pages/home/home-page'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('App', () => {
  it('renders the translated admin home title', async () => {
    await renderWithProviders(<HomePage />)

    expect(screen.getByRole('heading', {name: 'B2B SaaS Admin'})).toBeTruthy()
  })
})
