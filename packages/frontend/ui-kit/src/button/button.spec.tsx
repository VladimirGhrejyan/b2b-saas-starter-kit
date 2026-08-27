import {fireEvent, render, screen} from '@testing-library/react'

import {Button} from './button'

describe('Button', () => {
  it('renders a button', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', {name: 'Save'})).toBeTruthy()
  })

  it('defaults type to button', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button')).toHaveProperty('type', 'button')
  })

  it('forwards disabled', () => {
    render(<Button disabled>Save</Button>)

    expect(screen.getByRole('button')).toHaveProperty('disabled', true)
  })

  it('forwards onClick', () => {
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Save</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
