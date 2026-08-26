import type {TSESTree} from '@typescript-eslint/utils'
import {ESLintUtils} from '@typescript-eslint/utils'

import {ContextPath} from '../utils/context-path'

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/b2b-saas-starter-kit/eslint-plugin#${name}`)

/**
 * Forbids relative imports across bounded-context folders inside a layer project.
 * Package imports are enforced by `@nx/enforce-module-boundaries`.
 */
export const noCrossContextImportsRule = createRule({
  name: 'no-cross-context-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Do not import another bounded context internals; use IDs, events, or a published application port',
    },
    messages: {
      crossContext:
        'Do not import from context "{{imported}}" in "{{source}}". Cross-context interaction must use IDs, events, or a published application port.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceLocation = ContextPath.locate(context.filename)

    if (!sourceLocation) {
      return {}
    }

    const checkSpecifier = (specifier: string, node: TSESTree.Node) => {
      if (!ContextPath.isRelativeSpecifier(specifier)) {
        return
      }

      const importedLocation = ContextPath.locate(ContextPath.resolveRelative(context.filename, specifier))

      if (!importedLocation) {
        return
      }

      if (importedLocation.layerRoot !== sourceLocation.layerRoot) {
        return
      }

      if (importedLocation.segment === sourceLocation.segment) {
        return
      }

      if (ContextPath.isSharedFolder(importedLocation.segment)) {
        return
      }

      if (
        !ContextPath.isBoundaryContext(importedLocation.segment) &&
        !ContextPath.isApiSrcLayer(importedLocation.layerRoot)
      ) {
        return
      }

      context.report({
        node,
        messageId: 'crossContext',
        data: {
          imported: importedLocation.segment,
          source: sourceLocation.segment,
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
