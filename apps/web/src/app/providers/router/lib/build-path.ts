import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

export function buildPath(template: string, params: Record<string, string> = {}): string {
  return template.replaceAll(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    const value = params[name]

    if (TypeScriptUtils.isNil(value)) {
      throw new Error(`Missing path param "${name}"`)
    }

    return encodeURIComponent(value)
  })
}
