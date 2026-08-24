/**
 * Points a localhost DATABASE_URL at the compose-published host port.
 * Compose maps `POSTGRES_PORT` → container 5432; DATABASE_URL in `.env` is often left on 5432.
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
