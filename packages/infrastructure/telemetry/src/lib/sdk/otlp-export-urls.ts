export class OtlpExportUrls {
  static traces(endpoint: string): string {
    return `${OtlpExportUrls.#base(endpoint)}/v1/traces`
  }

  static metrics(endpoint: string): string {
    return `${OtlpExportUrls.#base(endpoint)}/v1/metrics`
  }

  static #base(endpoint: string): string {
    return endpoint.replace(/\/+$/, '')
  }
}
