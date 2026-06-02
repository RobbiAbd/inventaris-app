export const FILTER_ALL = '__ALL__'
export const FILTER_NONE = '__NONE__'

export function toFilterValue(value: string | undefined) {
  return value && value !== FILTER_ALL ? value : undefined
}

export function toOptionalKode(value: string | undefined) {
  return value && value !== FILTER_NONE ? value : null
}

export function fromOptionalKode(value: string | null | undefined) {
  return value ?? FILTER_NONE
}
