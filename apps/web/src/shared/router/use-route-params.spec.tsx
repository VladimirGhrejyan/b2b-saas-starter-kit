import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {z} from 'zod'

import {paths} from './paths'
import {useRouteParams} from './use-route-params'

function DemoParams() {
  const {id} = useRouteParams(z.object({id: z.string()}))

  return <span>{id}</span>
}

describe('useRouteParams', () => {
  it('parses params from the active route', () => {
    const router = createMemoryRouter([{path: paths.demoItem, element: <DemoParams />}], {
      initialEntries: ['/demo/abc'],
    })

    render(<RouterProvider router={router} />)

    expect(screen.getByText('abc')).toBeTruthy()
  })
})
