import type {Meta, StoryObj} from '@storybook/react-vite'

import {Button} from './button'

const meta = {
  title: 'Button',
  component: Button,
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Save',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Save',
    disabled: true,
  },
}
