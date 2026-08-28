import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {z} from 'zod'

import {paths} from './paths'
import {useRouteParams} from './use-route-params'

function MembersParams() {
  const {tenantId} = useRouteParams(z.object({tenantId: z.string()}))

  return <span>{tenantId}</span>
}

describe('useRouteParams', () => {
  it('parses params from the active route', () => {
    const router = createMemoryRouter([{path: paths.members, element: <MembersParams />}], {
      initialEntries: ['/tenants/abc/members'],
    })

    render(<RouterProvider router={router} />)

    expect(screen.getByText('abc')).toBeTruthy()
  })
})
