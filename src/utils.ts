import fs from 'fs'
import archiver from 'archiver'
import path from 'path'
import chalk from 'chalk'
import { Client } from 'ssh2'

export async function createZip(path: string, zipName: string): Promise<string[]> {
  return new Promise((resolve) => {
    const output = fs.createWriteStream(zipName)
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })
    output.on('close', () => {
      console.log(`✔ ${zipName} created`)
      resolve(fs.readdirSync(path))
    })
    archive.on('error', (err) => {
      console.log(chalk.red('❌createZip Error: ', err))
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
          await downloadBackup()
          resolve()
        })
        .on('data', (data: string) => {})
        .stderr.on('data', (data) => {
          console.log('backupRemotePath ERR: ' + data)
        })
    })
  })
  async function downloadBackup(): Promise<void> {
    return new Promise((resolve) => {
      conn.sftp((err, sftp) => {
        if (err) throw err
        sftp.fastGet(
          `${remotePath + zipName}`,
          path.join(root, zipName),
          (err2) => {
            if (err2) throw err2
            console.log(`✔ backup completed: ${zipName} in the root directory`)
            resolve()
          }
        )
      })
    })
  }
}
export async function deleteRemotePath(
  conn: Client,
  remotePath: string,
  fileName: string
): Promise<void> {
  if (!fileName) throw new Error('❌please provide a file name!')
  return new Promise((resolve) => {
    conn.exec(`cd ${remotePath} && rm -rf ${fileName}`, (err, stream) => {
      if (err) throw err
      stream
        .on('close', async () => {
          console.log(`delete completed: ${remotePath}${fileName}`)
          resolve()
        })
        .on('data', (data: string) => {
          console.log('deleteRemotePath OUT: ' + data)
        })
        .stderr.on('data', (data) => {
          console.log('deleteRemotePath ERR: ' + data)
        })
    })
  })
}
export async function uploadZip(
  conn: Client,
  root: string,
  remotePath: string,
  zipName: string
): Promise<void> {
  return new Promise((resolve) => {
    conn.sftp((err, sftp) => {
      if (err) throw err
      console.log(
        `upload start: ${path.join(root, zipName)} => ${remotePath + zipName}`
      )
      sftp.fastPut(path.join(root, zipName), remotePath + zipName, (err2) => {
        if (err2) throw err2
        console.log('✔ upload completed')
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
          console.log('✔ unzip completed')
          resolve()
        })
        .on('data', (data:any) => {})
        .stderr.on('data', (data) => {
          console.log('unzipOnServer ERR: ' + data)
        })
    })
  })
}
export async function deleteOnLocal(
  root: string,
  zipName: string
): Promise<void> {
  return new Promise((resolve) => {
    fs.unlinkSync(path.join(root, zipName))
    resolve()
  })
}
