import type {TSESTree} from '@typescript-eslint/utils'
import {AST_NODE_TYPES} from '@typescript-eslint/utils'

export type TopLevelKind = 'function' | 'class' | 'type' | 'constant'

export type TopLevelDeclaration = {
  kind: TopLevelKind
  node: TSESTree.Node
}

export class TopLevelDeclarations {
  static unwrapExpression(node: TSESTree.Expression): TSESTree.Expression {
    if (
      node.type === AST_NODE_TYPES.TSAsExpression ||
      node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
      node.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      return TopLevelDeclarations.unwrapExpression(node.expression)
    }

    return node
  }

  static isFunctionLikeExpression(node: TSESTree.Node | null | undefined): boolean {
    if (!node || !('type' in node)) {
      return false
    }

    if (
      node.type === AST_NODE_TYPES.TSAsExpression ||
      node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
      node.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      return TopLevelDeclarations.isFunctionLikeExpression(node.expression)
    }

    return node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression
  }

  static isClassLikeExpression(node: TSESTree.Node | null | undefined): boolean {
    if (!node || !('type' in node)) {
      return false
    }

    if (
      node.type === AST_NODE_TYPES.TSAsExpression ||
      node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
      node.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      return TopLevelDeclarations.isClassLikeExpression(node.expression)
    }

    return node.type === AST_NODE_TYPES.ClassExpression
  }

  static collect(program: TSESTree.Program): TopLevelDeclaration[] {
    const results: TopLevelDeclaration[] = []

    for (const statement of program.body) {
      TopLevelDeclarations.collectFromNode(statement, results)
    }

    return results
  }

  static filter(kind: TopLevelKind, declarations: TopLevelDeclaration[]): TopLevelDeclaration[] {
    return declarations.filter((declaration) => declaration.kind === kind)
  }

  private static collectFromNode(node: TSESTree.Node, results: TopLevelDeclaration[]): void {
    switch (node.type) {
      case AST_NODE_TYPES.FunctionDeclaration: {
        if (node.id !== null) {
          results.push({kind: 'function', node})
        }

        break
      }

      case AST_NODE_TYPES.ClassDeclaration: {
        results.push({kind: 'class', node})
        break
      }

      case AST_NODE_TYPES.TSTypeAliasDeclaration:
      case AST_NODE_TYPES.TSInterfaceDeclaration: {
        results.push({kind: 'type', node})
        break
      }

      case AST_NODE_TYPES.TSEnumDeclaration: {
        results.push({kind: 'constant', node})
        break
      }

      case AST_NODE_TYPES.VariableDeclaration: {
        for (const declarator of node.declarations) {
          TopLevelDeclarations.collectFromVariableDeclarator(declarator, results)
        }

        break
      }

      case AST_NODE_TYPES.ExportNamedDeclaration: {
        if (node.declaration) {
          TopLevelDeclarations.collectFromNode(node.declaration, results)
        }

        break
      }

      case AST_NODE_TYPES.ExportDefaultDeclaration: {
        const declaration = node.declaration

        if (declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
          results.push({kind: 'function', node: declaration})
        } else if (declaration.type === AST_NODE_TYPES.ClassDeclaration) {
          results.push({kind: 'class', node: declaration})
        } else if (TopLevelDeclarations.isFunctionLikeExpression(declaration)) {
          results.push({kind: 'function', node: declaration})
        } else if (TopLevelDeclarations.isClassLikeExpression(declaration)) {
          results.push({kind: 'class', node: declaration})
        }

        break
      }

      default: {
        break
      }
    }
  }

  private static collectFromVariableDeclarator(
    declarator: TSESTree.VariableDeclarator,
    results: TopLevelDeclaration[],
  ): void {
    if (declarator.id.type !== AST_NODE_TYPES.Identifier) {
      return
    }

    const init = declarator.init

    if (TopLevelDeclarations.isFunctionLikeExpression(init)) {
      results.push({kind: 'function', node: declarator})

      return
    }

    if (TopLevelDeclarations.isClassLikeExpression(init)) {
      results.push({kind: 'class', node: declarator})

      return
    }

    results.push({kind: 'constant', node: declarator})
  }
}
