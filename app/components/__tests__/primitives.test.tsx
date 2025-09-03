import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import Container from '../Container'
import Title from '../Title'
import Muted from '../Muted'
import Separator from '../Separator'
import { Button } from '../Button'

describe('UI primitives render', () => {
  it('renders Container with children', () => {
    const { getByText } = render(<Container>child</Container>)
    expect(getByText('child')).toBeTruthy()
  })
  it('renders Title levels', () => {
    const { container } = render(<Title level={2}>Heading</Title>)
    expect(container.querySelector('h2')).toBeTruthy()
  })
  it('renders Muted text', () => {
    const { getByText } = render(<Muted>muted</Muted>)
    expect(getByText('muted')).toBeTruthy()
  })
  it('renders Separator', () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toBeTruthy()
  })
  it('renders Button', () => {
    const { getByRole } = render(<Button>Click</Button>)
    expect(getByRole('button')).toBeTruthy()
  })
})


