import {ESLintUtils} from '@typescript-eslint/utils'

import {TopLevelDeclarations} from '../utils/top-level'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

export const maxClassesPerFileRule = createRule({
  name: 'max-classes-per-file',
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow at most one top-level class per file',
    },
    messages: {
      tooMany: 'Only one class is allowed per file (found {{count}}). Move extra classes into separate files.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const classes = TopLevelDeclarations.filter('class', TopLevelDeclarations.collect(node))

        if (classes.length <= 1) {
          return
        }

        for (const declaration of classes.slice(1)) {
          context.report({
            node: declaration.node,
            messageId: 'tooMany',
            data: {count: classes.length},
          })
        }
      },
    }
  },
})
