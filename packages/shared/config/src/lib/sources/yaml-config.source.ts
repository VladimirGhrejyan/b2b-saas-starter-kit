import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {load as loadYaml} from 'js-yaml'

import {ObjectUtils} from '@b2b-saas-starter-kit/utils'

import type {YamlLoadConfigOptions} from '../config-loader.types'

import {YamlConfigFilePattern} from './yaml-config-file.pattern'

/** Reads, parses, and shallow-merges YAML config files into one object. */
export class YamlConfigSource {
  /**
   * Loads YAML from `options.directory` and returns a merged plain object.
   *
   * @param options - YAML-specific load options.
   * @returns Merged configuration object (not yet Zod-validated).
   * @throws {Error} If the directory cannot be read, no YAML files are found, or a file is not a mapping.
   */
  static load(options: YamlLoadConfigOptions): Record<string, unknown> {
    const fileNames = YamlConfigSource.resolveFileNames(options)
    let merged: Record<string, unknown> = {}

    for (const fileName of fileNames) {
      const filePath = join(options.directory, fileName)
      const content = readFileSync(filePath, 'utf8')
      const parsed: unknown = loadYaml(content)

      if (parsed === null || parsed === undefined) {
        continue
      }

      if (!ObjectUtils.isPlainObject(parsed)) {
        throw new Error(`Config file "${filePath}" must contain a YAML mapping (object), got ${typeof parsed}`)
      }

      merged = ObjectUtils.merge(merged, parsed)
    }

    return merged
  }

  private static resolveFileNames(options: YamlLoadConfigOptions): string[] {
    const {directory, files} = options

    let fileNames: string[]

    try {
      fileNames =
        files ??
        readdirSync(directory)
          .filter((name) => YamlConfigFilePattern.matches(name))
          .sort()
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      const wrapped = new Error(`Cannot read config directory "${directory}": ${reason}`)

      if (error instanceof Error) {
        wrapped.cause = error
      }

      throw wrapped
    }

    if (fileNames.length === 0) {
      throw new Error(`No YAML config files found in "${directory}"`)
    }

    return fileNames
  }
}
