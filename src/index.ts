import chalk from 'chalk'
import path from 'path'
import { Client } from 'ssh2'
import type { PluginConfig } from './types'
import type { ResolvedConfig } from 'vite'
import {
  createZip,
  backupRemotePath,
  deleteRemotePath,
  uploadZip,
  unzipOnServer,
  deleteOnLocal,
} from './utils'

export default function SSHDeploy({
  enable = true,
  host,
  port = 22,
  username,
  password,
  remotePath,
  previewPath,
  backup = false,
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
        console.log(chalk.blue('🚀deploy start'))
        const { root, build } = config
        const buildOutDir = path.join(root, build.outDir)
        const startTime = Date.now()
        const zipName = 'dist.zip'
        const filesInDist =await createZip(buildOutDir, zipName)
        const conn = new Client()
        conn
          .on('ready', async () => {
            try {
              console.log(chalk.green(`🔗connect to ${host} success!`))
              if (backup) {
                const backupStartTime = Date.now()
                await backupRemotePath(conn, root, remotePath)
                const backupEndTime = Date.now()
                console.log(
                  chalk.green(
                    `⭐backup over, lost：${backupEndTime - backupStartTime}ms`
                  )
                )
              }
              await deleteRemotePath(conn, remotePath, `(${filesInDist.join(' ')})`)
              await uploadZip(conn, root, remotePath, zipName)
              await unzipOnServer(conn, remotePath, zipName)
              await deleteRemotePath(conn, remotePath, zipName)
            } catch (err) {
              console.log(chalk.red(err))
            }
            conn.destroy()
            const endTime = Date.now()
            console.log(
              chalk.green(`⭐deploy over, all time：${endTime - startTime}ms`)
            )
            console.log(chalk.blue(`preview url: ${previewPath}`))
            deleteOnLocal(root, zipName)
          })
          .on('error', (err) => {
            console.error('❌FTP error: ', err.description)
          })
          .on('end', () => {
            console.error('FTP end...')
          })
          .on('close', () => {
            console.error('FTP close...')
          })
          .connect({
            host,
            port,
            username,
            password,
          })
      }
    },
  }
}
