import type {Linter} from 'eslint'

/** Apps layer: TypeScript `private`, not ECMAScript # fields. */
export class AppsEslintConfig {
  static readonly config: Linter.Config = {
    files: ['apps/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'PropertyDefinition[key.type="PrivateIdentifier"]',
          message: 'In apps, use the `private` keyword instead of # fields.',
        },
        {
          selector: 'MethodDefinition[key.type="PrivateIdentifier"]',
          message: 'In apps, use the `private` keyword instead of # methods.',
        },
      ],
    },
  }
}
