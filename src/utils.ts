import { normalizePath } from 'vite'
import path from 'path'

export function fmtLocalPath(...args: string[]): string {
  return normalizePath(path.resolve(...args))
}

export function fmtRemotePath(...args: string[]): string {
  return normalizePath(path.join(...args))
}
