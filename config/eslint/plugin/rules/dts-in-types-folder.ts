import {ESLintUtils} from '@typescript-eslint/utils'

import {FsdPath} from '../utils/fsd-path'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

const TYPES_FOLDER = /(?:^|\/)@types\//

/**
 * Ambient `.d.ts` files must live in a folder named `@types`.
 */
export const dtsInTypesFolderRule = createRule({
  name: 'dts-in-types-folder',
  meta: {
    type: 'problem',
    docs: {
      description: 'Place ambient .d.ts files in an @types folder',
    },
    messages: {
      misplaced: 'Ambient declaration files must live in a folder named "@types" (e.g. src/app/@types/i18next.d.ts).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = FsdPath.normalize(context.filename)

    if (!filename.endsWith('.d.ts') || TYPES_FOLDER.test(filename)) {
      return {}
    }

    return {
      Program(node) {
        context.report({node, messageId: 'misplaced'})
      },
    }
  },
})
