import {describe, expect, it} from 'vitest'

import {StringUtils} from './string.utils'

describe('StringUtils', () => {
  it('blank checks and trimToUndefined', () => {
    expect(StringUtils.isBlank('')).toBe(true)
    expect(StringUtils.isBlank('  ')).toBe(true)
    expect(StringUtils.isBlank(null)).toBe(true)
    expect(StringUtils.isBlank('x')).toBe(false)
    expect(StringUtils.isNotBlank('x')).toBe(true)
    expect(StringUtils.trimToUndefined('  hi  ')).toBe('hi')
    expect(StringUtils.trimToUndefined('   ')).toBeUndefined()
  })

  it('truncate', () => {
    expect(StringUtils.truncate('hello', 10)).toBe('hello')
    expect(StringUtils.truncate('hello world', 8)).toBe('hello w…')
  })

  it('casing helpers', () => {
    expect(StringUtils.capitalize('hello')).toBe('Hello')
    expect(StringUtils.toCamelCase('hello_world-name')).toBe('helloWorldName')
    expect(StringUtils.toPascalCase('hello_world')).toBe('HelloWorld')
    expect(StringUtils.toKebabCase('HelloWorld')).toBe('hello-world')
    expect(StringUtils.toSnakeCase('HelloWorld')).toBe('hello_world')
  })
})
