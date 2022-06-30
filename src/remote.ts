import { Client, SFTPWrapper } from 'ssh2'
import chalk from 'chalk'
import fs from 'fs'
import { fmtPath } from './utils'
import { ClientConfig } from './types'

const { log } = console

export default class RemoteClient {
  conn: Client
  sftp: SFTPWrapper | undefined
  localRoot: string
  remoteRoot: string
  constructor(localRoot: string, remoteRoot: string) {
    this.conn = new Client()
    this.localRoot = localRoot
    this.remoteRoot = remoteRoot
  }

  connect({ host, port, username, password }: ClientConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn
        .on('ready', () => {
          log(chalk.green(`🔗 connect to ${host} success!`))
          this.conn.sftp((err, sftp) => {
            if (err) reject(err)
            this.sftp = sftp
            resolve()
          })
        })
        .on('error', (err) => {
          reject(new Error('❌ FTP error: ' + err.description))
        })
        .on('end', () => {
          log('FTP end...')
        })
        .on('close', () => {
          log('FTP close...')
        })
        .connect({
          host,
          port,
          username,
          password,
        })
    })
  }

  destroy() {
    this.sftp?.end()
    this.conn.destroy()
  }

  async backup(zipName = '_backup.zip'): Promise<void> {
    log(chalk.cyan(`backup start`))
    const backupStartTime = Date.now()
    return new Promise((resolve) => {
      this.conn.exec(
        `cd ${this.remoteRoot} && zip -q -r ${zipName} *`,
        (err, stream) => {
          if (err) throw err
          stream
            .on('close', async () => {
              await this._downloadFile(zipName)
              log(
                chalk.green(
                  `✔ backup completed: ${zipName} in the ${this.localRoot}\n`
                )
              )
              const backupEndTime = Date.now()
              log(
                chalk.cyan(
                  `⭐ backup over, lost：${backupEndTime - backupStartTime}ms`
                )
              )
              stream.destroy()
              resolve()
            })
            .on('data', (data: string) => {})
            .stderr.on('data', (data) => {
              log('remote backup err: ' + data)
            })
        }
      )
    })
  }

  private async _downloadFile(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp?.fastGet(
        fmtPath(this.remoteRoot, fileName),
        fmtPath(this.localRoot, fileName),
        (err2) => {
          if (err2) reject(err2)
          resolve()
        }
      )
    })
  }

  async remove(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn.exec(
        `cd ${this.remoteRoot} && rm -rf -v ${fileName}`,
        (err, stream) => {
          if (err) reject(err)
          stream
            .on('close', async () => {
              log(chalk.green(`✔ remove completed\n`))
              stream.destroy()
              resolve()
            })
            .on('data', (data: any) => {
              log(data.toString())
            })
            .stderr.on('data', (data) => {
              log('remote remove err: ' + data)
            })
        }
      )
    })
  }

  async uploadDir(localPath = '', remotePath = ''): Promise<void> {
    const upLocalPath = fmtPath(this.localRoot, localPath)
    const upRemotePath = fmtPath(this.remoteRoot, remotePath)
    log(`upload start: ${upLocalPath} => ${upRemotePath}`)
    return new Promise((resolve, reject) => {
      if (fs.existsSync(upLocalPath)) {
        const stats = fs.statSync(upLocalPath)
        if (stats.isDirectory()) {
          this._uploadDir(upLocalPath, upRemotePath)
            .then(() => {
              log(`upload: ${upLocalPath} success`)
              resolve()
            })
            .catch((err) => {
              log(`upload error: ${upLocalPath}`)
              reject(err)
            })
        } else reject(new Error(`${localPath} is not a directory`))
      } else reject(new Error(`no such directory: ${localPath}`))
    })
  }
  private async _uploadDir(
    localPath: string,
    remotePath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const files = fs.readdirSync(localPath)
      Promise.all(
        files.map(async (file) => {
          const fileLocalPath = fmtPath(localPath, file)
          const fileRemotePath = fmtPath(remotePath, file)
          const fileStat = fs.statSync(fileLocalPath)
          if (fileStat.isDirectory()) {
            const dirExist = await this._exists(fileRemotePath)
            if (!dirExist) await this._mkdir(fileRemotePath)
            return this._uploadDir(fileLocalPath, fileRemotePath)
          } else if (fileStat.isFile()) {
            return this._uploadFile(fileLocalPath, fileRemotePath)
          } else {
            reject(new Error(`${fileLocalPath} is not a directory or a file`))
          }
        })
      )
        .then(() => resolve())
        .catch((err) => reject(err))
    })
  }

  async uploadFile(fileName: string): Promise<void> {
    const upLocalPath = fmtPath(this.localRoot, fileName)
    const upRemotePath = this.remoteRoot + fileName
    log(`upload start: ${upLocalPath} => ${upRemotePath}`)
    return new Promise((resolve, reject) => {
      if (fs.existsSync(upLocalPath)) {
        this._uploadFile(upLocalPath, upRemotePath)
          .then(() => {
            log(chalk.green('✔ upload completed\n'))
            resolve()
          })
          .catch((err) => reject(err))
      } else reject(new Error(`no such file: ${upLocalPath}`))
    })
  }
  private async _uploadFile(
    localPath: string,
    remotePath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp?.fastPut(localPath, remotePath, (err2) => {
        if (err2) reject(err2)
        resolve()
      })
    })
  }

  private async _exists(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.sftp?.stat(path, (err) => {
        if (err) resolve(false)
        resolve(true)
      })
    })
  }

  private async _mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp?.mkdir(path, (err2) => {
        if (err2) reject(err2)
        resolve()
      })
    })
  }

  async unzip(zipName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      log(`unzip start: ${this.remoteRoot}${zipName}`)
      this.conn.exec(
        `cd ${this.remoteRoot} && unzip ${zipName}`,
        (err, stream) => {
          if (err) reject(err)
          stream
            .on('close', () => {
              log(chalk.green('✔ unzip completed\n'))
              stream.destroy()
              resolve()
            })
            .on('data', (data: any) => {})
            .stderr.on('data', (data) => {
              log('remote unzip err: ' + data)
            })
        }
      )
    })
  }
}
