/**
 * Asset versioning helper utility for cache busting
 *
 * Usage in EJS templates:
 * <link rel="stylesheet" href="<%= asset('/dist/main.css') %>">
 * <script src="<%= asset('/dist/highlight.js') %>"></script>
 *
 * This will generate URLs like:
 * /dist/main.css?v=1733537340700
 * /dist/highlight.js?v=1733537340700
 */

function getAssetVersion(): string {
  return process.env['VERSION'] || Date.now().toString();
}

/**
 * Generates a versioned asset URL for cache busting
 * @param {string} assetPath - The path to the asset (e.g., '/dist/main.css', '/dist/highlight.js')
 * @returns {string} The versioned asset URL with query parameter
 *
 * @example
 * asset('/dist/main.css') => '/dist/main.css?v=1733537340700'
 * asset('/dist/highlight.js') => '/dist/highlight.js?v=1733537340700'
 * asset('/dist/style.css?param=value') => '/dist/style.css?param=value&v=1733537340700'
 */
export function asset(assetPath: string): string {
  const version = getAssetVersion();
  const separator = assetPath.includes('?') ? '&' : '?';
  return `${assetPath}${separator}v=${version}`;
}