export function publicPath(path: string) {
  const baseURL = useRuntimeConfig().app.baseURL
  const normalizedBase = baseURL.endsWith('/') ? baseURL : `${baseURL}/`

  return `${normalizedBase}${path.replace(/^\/+/, '')}`
}
