import {screen} from '@testing-library/react'

import {DevPrincipalPicker} from '@/features/dev-principal'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

vi.mock('@/shared/environment', () => ({
  environment: {
    appEnv: 'production',
    apiBaseUrl: 'http://web.test/v1',
  },
}))

describe('DevPrincipalPicker', () => {
  it('is hidden when baked env is not development', async () => {
    await renderWithProviders(<DevPrincipalPicker />)

    expect(screen.queryByLabelText('User ID')).toBeNull()
    expect(screen.queryByText('Dev principal')).toBeNull()
  })
})
