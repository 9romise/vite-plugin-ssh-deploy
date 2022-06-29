import fs from 'fs'
import archiver from 'archiver'
import path from 'path'
import chalk from 'chalk'
import { Client } from 'ssh2'

export async function createZip(path: string, zipName: string): Promise<void> {
  return new Promise((resolve) => {
    const output = fs.createWriteStream(zipName)
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })
    output.on('close', () => {
      console.log(chalk.green(`✔ ${zipName} created\n`))
      resolve()
    })
    archive.on('error', (err) => {
      console.log(chalk.red('❌ createZip Error: ', err))
    })
    archive.pipe(output)
    archive.directory(path, false)
    archive.finalize()
  })
}
export async function backupRemotePath(
  conn: Client,
  root: string,
  remotePath: string
): Promise<void> {
  const zipName = 'backup.zip'
  return new Promise((resolve) => {
    conn.exec(`cd ${remotePath} && zip -q -r ${zipName} *`, (err, stream) => {
      if (err) throw err
      stream
        .on('close', async () => {
          await downloadZip()
          resolve()
        })
        .on('data', (data: string) => {})
        .stderr.on('data', (data) => {
          console.log('backupRemotePath ERR: ' + data)
        })
    })
  })
  async function downloadZip(): Promise<void> {
    return new Promise((resolve) => {
      conn.sftp((err, sftp) => {
        if (err) throw err
        sftp.fastGet(
          `${remotePath + zipName}`,
          path.join(root, zipName),
          (err2) => {
            if (err2) throw err2
            console.log(
              chalk.green(
                `✔ backup completed: ${zipName} in the root directory\n`
              )
            )
            resolve()
          }
        )
      })
    })
  }
}
export async function deleteFileOnServer(
  conn: Client,
  remotePath: string,
  fileName: string | string[]
): Promise<void> {
  return new Promise((resolve) => {
    const files = typeof fileName === 'string' ? fileName : fileName.join(' ')
    conn.exec(`cd ${remotePath} && rm -rf -v ${files}`, (err, stream) => {
      if (err) throw err
      stream
        .on('close', async () => {
          console.log(chalk.green(`✔ delete completed\n`))
          resolve()
        })
        .on('data', (data: any) => {
          console.log(data.toString())
        })
        .stderr.on('data', (data) => {
          console.log('deleteRemotePath ERR: ' + data)
        })
    })
  })
}
export async function uploadFile(
  conn: Client,
  localPath: string,
  remotePath: string
): Promise<void> {
  return new Promise((resolve) => {
    conn.sftp((err, sftp) => {
      if (err) throw err
      console.log(`upload start: ${localPath} => ${remotePath}`)
      sftp.fastPut(localPath, remotePath, (err2) => {
        if (err2) throw err2
        console.log(chalk.green('✔ upload completed\n'))
        resolve()
      })
    })
  })
}
export async function unzipOnServer(
  conn: Client,
  remotePath: string,
  zipName: string
): Promise<void> {
  return new Promise((resolve) => {
    console.log(`unzip start: ${remotePath}${zipName}`)
    conn.exec(`cd ${remotePath} && unzip ${zipName}`, (err, stream) => {
      if (err) throw err
      stream
        .on('close', () => {
          console.log(chalk.green('✔ unzip completed\n'))
          resolve()
        })
        .on('data', (data: any) => {})
        .stderr.on('data', (data) => {
          console.log('unzipOnServer ERR: ' + data)
        })
    })
  })
}
