/** Matches `*.yml` / `*.yaml` config file names. */
export class YamlConfigFilePattern {
  private static readonly pattern = /\.(ya?ml)$/i

  static matches(fileName: string): boolean {
    return YamlConfigFilePattern.pattern.test(fileName)
  }
}
