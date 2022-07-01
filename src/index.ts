import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import type { PluginConfig } from './types'
import type { ResolvedConfig } from 'vite'
import LocalClient from './local'
import RemoteClient from './remote'

const { log } = console

export default function SSHDeploy({
  enable = true,
  mode = 'file',
  host,
  port = 22,
  username,
  password,
  remotePath,
  previewPath,
  backup = false,
  removeLocalZip = true,
}: PluginConfig) {
  let config: ResolvedConfig
  return {
    name: 'vite-plugin-ssh-deploy',
    apply: 'build',
    enforce: 'post',
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig
    },
    async closeBundle() {
      if (enable) {
        log(chalk.blue('\n🚀 deploy start'))

        const { root, build } = config
        const { outDir } = build
        const startTime = Date.now()
        const zipName = 'dist.zip'
        const localClient = new LocalClient(root)
        const remoteClient = new RemoteClient(root, remotePath)

        if (mode === 'zip') await localClient.createZip(outDir, zipName)
        try {
          await remoteClient.connect({ host, port, username, password })
          // backup
          if (backup) await remoteClient.backup()
          // remote files on server
          const filesInDist = localClient.readDir(outDir)
          await remoteClient.remove(filesInDist.join(' '))
          // upload
          if (mode === 'zip') {
            await remoteClient.uploadFile(zipName)
          } else if (mode === 'file') {
            await remoteClient.uploadDir(outDir)
          }
          if (mode === 'zip') {
            // unzip
            await remoteClient.unzip(zipName)
            await remoteClient.remove(zipName)
          }
          const endTime = Date.now()
          log(chalk.blue(`🚀 deploy over, all time：${endTime - startTime}ms`))
          if (previewPath)
            log('✨ preview url: ' + chalk.yellow(`${previewPath}`))
          if (mode === 'zip' && removeLocalZip) localClient.removeFile(zipName)
        } catch (err) {
          log(chalk.red(err))
        } finally {
          remoteClient.destroy()
        }
      }
    },
  }
}
