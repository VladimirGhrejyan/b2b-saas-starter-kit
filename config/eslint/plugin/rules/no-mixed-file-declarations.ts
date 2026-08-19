import path from 'node:path'

import {ESLintUtils} from '@typescript-eslint/utils'

import {TopLevelDeclarations} from '../utils/top-level'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

const COMPONENT_FILE = /\.component\.tsx$/

export const noMixedFileDeclarationsRule = createRule({
  name: 'no-mixed-file-declarations',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Do not mix functions/classes with types/interfaces/constants in one file (with a .component.tsx exception)',
    },
    messages: {
      mixedRuntimeAndDeclarations:
        'Do not mix runtime code (functions/classes) with types/interfaces/constants in the same file.',
      mixedFunctionAndClass: 'Do not mix a standalone function and a class in the same file.',
      invalidComponentException:
        '.component.tsx files may contain exactly one function and exactly one type/interface (no classes or constants).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const declarations = TopLevelDeclarations.collect(node)
        const functions = TopLevelDeclarations.filter('function', declarations)
        const classes = TopLevelDeclarations.filter('class', declarations)
        const types = TopLevelDeclarations.filter('type', declarations)
        const constants = TopLevelDeclarations.filter('constant', declarations)

        const filename = context.filename
        const isComponentFile = COMPONENT_FILE.test(path.basename(filename))

        if (functions.length > 0 && classes.length > 0) {
          const reportNode = classes[0].node

          context.report({node: reportNode, messageId: 'mixedFunctionAndClass'})

          return
        }

        const hasRuntime = functions.length + classes.length > 0
        const hasDeclarations = types.length + constants.length > 0

        if (!hasRuntime || !hasDeclarations) {
          return
        }

        if (
          isComponentFile &&
          functions.length === 1 &&
          classes.length === 0 &&
          types.length === 1 &&
          constants.length === 0
        ) {
          return
        }

        if (isComponentFile) {
          context.report({node, messageId: 'invalidComponentException'})

          return
        }

        context.report({node, messageId: 'mixedRuntimeAndDeclarations'})
      },
    }
  },
})
