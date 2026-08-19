import {ESLintUtils} from '@typescript-eslint/utils'

import {TopLevelDeclarations} from '../utils/top-level'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

export const maxStandaloneFunctionsRule = createRule({
  name: 'max-standalone-functions',
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow at most one top-level standalone function per file',
    },
    messages: {
      tooMany:
        'Only one standalone function is allowed per file (found {{count}}). Move extra functions into a class or separate files.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const functions = TopLevelDeclarations.filter('function', TopLevelDeclarations.collect(node))

        if (functions.length <= 1) {
          return
        }

        for (const declaration of functions.slice(1)) {
          context.report({
            node: declaration.node,
            messageId: 'tooMany',
            data: {count: functions.length},
          })
        }
      },
    }
  },
})
