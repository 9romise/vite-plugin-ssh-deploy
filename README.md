<h1 align="center">vite-plugin-ssh-deploy</h1>

<p align="center">A plugin for uploading the local build directory to the host server.</p>
<p align="center">
  <a href="https://www.npmjs.com/package/vite-plugin-ssh-deploy">
	<img src="https://img.shields.io/npm/v/vite-plugin-ssh-deploy" alt="NPM version" />
  </a>
</p>

> [!IMPORTANT]
> This is a plugin I implemented early in my learning journey, and it is not a good solution to the deployment issue.
> 
> This plugin only uses the `closeBundle` hook so it can be a standalone script that runs independently at any time.
> 
> If you need any assistance, feel free to contact me.


## Features

- Upload the local build outdir to the host server
- Backup from the host server

## Notice

**If you use zip mode, you need to install unzip on the host server**

**if you want to backup, you need to install zip on the host server**

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
        port: 22,
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

