import fs from 'fs'
import archiver from 'archiver'
import chalk from 'chalk'
import { fmtPath } from './utils'

const { log } = console

export default class LocalClient {
  root: string

  constructor(root: string) {
    this.root = root
  }

  async createZip(dir: string, zipName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipName)
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })
      output.on('close', () => {
        log(chalk.green(`✔ ${zipName} created\n`))
        resolve()
      })
      archive.on('error', (err) => {
        reject(err)
      })
      archive.pipe(output)
      archive.directory(fmtPath(this.root, dir), false)
      archive.finalize()
    })
  }

  readDir(dir: string) {
    return fs.readdirSync(fmtPath(this.root, dir))
  }

  removeFile(fileName: string) {
    return fs.unlinkSync(fmtPath(this.root, fileName))
  }
}
