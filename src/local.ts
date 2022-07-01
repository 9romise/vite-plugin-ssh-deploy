import fs from 'fs'
import archiver from 'archiver'
import chalk from 'chalk'
import { fmtLocalPath } from './utils'

const { log } = console

export default class LocalClient {
  root: string

  constructor(root: string) {
    this.root = root
  }

  async createZip(dir: string, zipName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const zipPath = fmtLocalPath(this.root, zipName)
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })
      output.on('close', () => {
        log(chalk.green(`✔ ${zipPath} created\n`))
        resolve()
      })
      archive.on('error', (err) => {
        reject(err)
      })
      archive.pipe(output)
      archive.directory(fmtLocalPath(this.root, dir), false)
      archive.finalize()
    })
  }

  readDir(dir: string) {
    return fs.readdirSync(fmtLocalPath(this.root, dir))
  }

  removeFile(fileName: string) {
    return fs.unlinkSync(fmtLocalPath(this.root, fileName))
  }
}
