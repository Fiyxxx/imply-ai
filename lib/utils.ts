/**
 * Tailwind badge classes for each HTTP method.
 * Shared between the Actions list page and the OpenAPI import modal.
 */
export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
}
