import type { Meta, StoryObj } from '@storybook/react';
import { MicromouseVisualizer } from '../src/components/MicromouseVisualizer/MicromouseVisualizer';

const meta = {
  title: 'Components/MicromouseVisualizer',
  component: MicromouseVisualizer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MicromouseVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 400,
    height: 400,
  },
};