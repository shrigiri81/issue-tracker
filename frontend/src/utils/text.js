/**
 * Strips outer quotes and/or wrapper tags added during editing or JSON transmission.
 * Specifically fixes:
 * 1. Content enclosed in outer quotes added to either ends (e.g. "Hello world" -> Hello world)
 * 2. Any <content>...</content> tags
 * 3. JSON serialized string objects
 */
export function stripContentWrapper(text) {
  if (text == null) return ''
  let cleaned = String(text).trim()

  // Handle JSON object representation if stored as raw string
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned)
      if (parsed.commentContent) return stripContentWrapper(parsed.commentContent)
      if (parsed.commentData) return stripContentWrapper(parsed.commentData)
      if (parsed.content) return stripContentWrapper(parsed.content)
    } catch {
      // Not JSON, continue with string processing
    }
  }

  // Strip <content> tags
  if (cleaned.startsWith('<content>') && cleaned.endsWith('</content>')) {
    cleaned = cleaned.slice(9, -10).trim()
  }

  // Strip outer quotes (added to either ends by raw JSON string transmission)
  while (typeof cleaned === 'string' && cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
    try {
      const parsed = JSON.parse(cleaned)
      if (typeof parsed === 'string') {
        cleaned = parsed.trim()
        continue
      }
    } catch {
      // Ignore parse failure
    }
    cleaned = cleaned.slice(1, -1).trim()
  }

  // Unescape any escaped characters if any remain
  if (typeof cleaned === 'string') {
    cleaned = cleaned.replace(/\\"/g, '"')
  }

  return cleaned
}
