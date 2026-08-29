/**
 * Points a localhost REDIS_URL at the compose-published host port.
 */
export function applyComposeHostPort(urlString: string, port: string | undefined): string {
  if (!port) {
    return urlString
  }

  const url = new URL(urlString)

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    url.port = port
  }

  return url.toString()
}
