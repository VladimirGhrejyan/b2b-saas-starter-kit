import {RuleTester} from '@typescript-eslint/rule-tester'
import tseslint from 'typescript-eslint'
import {afterAll, describe, it} from 'vitest'

import {maxClassesPerFileRule} from './max-classes-per-file'
import {maxStandaloneFunctionsRule} from './max-standalone-functions'
import {noMixedFileDeclarationsRule} from './no-mixed-file-declarations'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {jsx: true},
    },
  },
})

ruleTester.run('max-standalone-functions', maxStandaloneFunctionsRule, {
  valid: [
    {
      code: `export function onlyOne() { return 1 }`,
    },
    {
      code: `export const onlyOne = () => 1`,
    },
    {
      code: `
        export class Service {
          a() { return 1 }
          b() { return 2 }
          c = () => 3
        }
      `,
    },
    {
      code: `
        export function outer() {
          const inner = () => 1
          function nested() { return 2 }
          return inner() + nested()
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        export function a() { return 1 }
        export function b() { return 2 }
      `,
      errors: [{messageId: 'tooMany'}],
    },
    {
      code: `
        const a = () => 1
        const b = function () { return 2 }
      `,
      errors: [{messageId: 'tooMany'}],
    },
  ],
})

ruleTester.run('max-classes-per-file', maxClassesPerFileRule, {
  valid: [
    {
      code: `export class OnlyOne { method() { return 1 } }`,
    },
    {
      code: `const OnlyOne = class { method() { return 1 } }`,
    },
  ],
  invalid: [
    {
      code: `
        export class A {}
        export class B {}
      `,
      errors: [{messageId: 'tooMany'}],
    },
    {
      code: `
        class A {}
        const B = class {}
      `,
      errors: [{messageId: 'tooMany'}],
    },
  ],
})

ruleTester.run('no-mixed-file-declarations', noMixedFileDeclarationsRule, {
  valid: [
    {
      code: `export type UserId = string\nexport interface User { id: UserId }`,
    },
    {
      code: `export const A = 1\nexport const B = 2\nexport enum Kind { A, B }`,
    },
    {
      code: `export class Service { run() { return 1 } }`,
    },
    {
      code: `export function run() { return 1 }`,
    },
    {
      filename: 'button.component.tsx',
      code: `
        type ButtonProps = { label: string }
        export function Button(props: ButtonProps) { return props.label }
      `,
    },
  ],
  invalid: [
    {
      code: `
        type Id = string
        export function run(id: Id) { return id }
      `,
      errors: [{messageId: 'mixedRuntimeAndDeclarations'}],
    },
    {
      code: `
        export const LIMIT = 10
        export class Service { run() { return LIMIT } }
      `,
      errors: [{messageId: 'mixedRuntimeAndDeclarations'}],
    },
    {
      code: `
        export function run() { return 1 }
        export class Service {}
      `,
      errors: [{messageId: 'mixedFunctionAndClass'}],
    },
    {
      filename: 'button.component.tsx',
      code: `
        type A = string
        type B = number
        export function Button() { return null }
      `,
      errors: [{messageId: 'invalidComponentException'}],
    },
    {
      filename: 'button.component.tsx',
      code: `
        type Props = { label: string }
        export const LABEL = 'x'
        export function Button(props: Props) { return props.label }
      `,
      errors: [{messageId: 'invalidComponentException'}],
    },
  ],
})
