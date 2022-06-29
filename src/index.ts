import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { Client } from 'ssh2'
import type { PluginConfig } from './types'
import type { ResolvedConfig } from 'vite'
import {
  createZip,
  backupRemotePath,
  deleteFileOnServer,
  uploadFile,
  unzipOnServer,
} from './utils'

export default function SSHDeploy({
  enable = true,
  // mode = 'zip',
  host,
  port = 22,
  username,
  password,
  remotePath,
  previewPath,
  backup = false,
  deleteLocalZip = true,
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
        console.log(chalk.blue('\n🚀 deploy start'))
        const { root, build } = config
        const buildOutDir = path.join(root, build.outDir)
        const startTime = Date.now()
        const zipName = 'dist.zip'
        const filesInDist = fs.readdirSync(buildOutDir)
        // if (mode === 'zip')
        await createZip(buildOutDir, zipName)
        const conn = new Client()
        conn
          .on('ready', async () => {
            console.log('FTP open...')
            try {
              console.log(chalk.green(`🔗 connect to ${host} success!`))
              if (backup) {
                const backupStartTime = Date.now()
                await backupRemotePath(conn, root, remotePath)
                const backupEndTime = Date.now()
                console.log(
                  chalk.greenBright(
                    `⭐backup over, lost：${backupEndTime - backupStartTime}ms`
                  )
                )
              }
              await deleteFileOnServer(conn, remotePath, filesInDist)
              // if (mode === 'zip') {
              await uploadFile(
                conn,
                path.join(root, zipName),
                remotePath + zipName
              )
              await unzipOnServer(conn, remotePath, zipName)
              await deleteFileOnServer(conn, remotePath, zipName)
              // } else if (mode === 'file') {
              // await uploadFiles()
              // }
            } catch (err) {
              console.log(chalk.red(err))
            }
            conn.destroy()
            const endTime = Date.now()
            console.log(
              chalk.blue(`🚀 deploy over, all time：${endTime - startTime}ms`)
            )
            console.log('✨ preview url: ' + chalk.blue(`${previewPath}`))
            // if (mode === 'zip' && deleteLocalZip)
            if (deleteLocalZip) fs.unlinkSync(path.join(root, zipName))
          })
          .on('error', (err) => {
            console.error('❌ FTP error: ', err.description)
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
