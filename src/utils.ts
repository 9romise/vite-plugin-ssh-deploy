import { normalizePath } from 'vite'
import path from 'path'

export function fmtPath(...args: string[]): string {
  return normalizePath(path.join(...args))
}
