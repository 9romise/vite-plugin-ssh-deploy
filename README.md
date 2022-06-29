

<h1 align="center">vite-plugin-ssh-deploy</h1>

<p align="center">A plugin for uploading the local build directory to the host server.</p>
<p align="center">
  <a href="https://www.npmjs.com/package/vite-plugin-ssh-deploy">
	<img src="https://img.shields.io/npm/v/vite-plugin-ssh-deploy" alt="NPM version" />
  </a>
</p>

## Features

- Upload the local build directory to the host server
- Backup from the host server

## Notice

**You need to install unzip on the host server**

**if you want to backup, zip is also necessary**

## Install

```bash
npm i vite-plugin-ssh-deploy -D
```

## Usage

### example:

```typescript
// vite.config.ts
import SSHDeploy from 'vite-plugin-ssh-deploy'

export default {
  plugins: [
    SSHDeploy({
        host: '***.***.***.***',
        username: '****',
        password: '******',
        remotePath: '/usr/local/www/',
        previewPath: 'https://github.com',
    })
  ]
}
```

Refer to [types](./src/types.ts) for all options 

## License

 [MIT License](./LICENSE) © 2022 [Vida Xie](https://github.com/vidaaaa)

