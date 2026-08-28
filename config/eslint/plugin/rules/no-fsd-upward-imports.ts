import type {TSESTree} from '@typescript-eslint/utils'
import {ESLintUtils} from '@typescript-eslint/utils'

import {FsdPath} from '../utils/fsd-path'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

/**
 * Forbids importing a higher FSD layer (app → pages → features → shared).
 */
export const noFsdUpwardImportsRule = createRule({
  name: 'no-fsd-upward-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'FSD imports must point downward: app → pages → features → shared',
    },
    messages: {
      upward:
        'Do not import FSD layer "{{imported}}" from "{{source}}". Imports must point downward (app → pages → features → shared).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceLayer = FsdPath.locate(context.filename)

    if (!sourceLayer) {
      return {}
    }

    const checkSpecifier = (specifier: string, node: TSESTree.Node) => {
      const importedLayer = FsdPath.locateSpecifier(context.filename, specifier)

      if (!importedLayer) {
        return
      }

      if (FsdPath.rank(importedLayer) <= FsdPath.rank(sourceLayer)) {
        return
      }

      context.report({
        node,
        messageId: 'upward',
        data: {
          imported: importedLayer,
          source: sourceLayer,
        },
      })
    }

    return {
      ImportDeclaration(node) {
        checkSpecifier(node.source.value, node)
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkSpecifier(node.source.value, node)
        }
      },
      ExportAllDeclaration(node) {
        checkSpecifier(node.source.value, node)
      },
    }
  },
})
