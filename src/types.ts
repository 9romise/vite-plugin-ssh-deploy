export interface PluginConfig {
  /**
   * enable the plugin
   * @default true
   */
  enable?: boolean
  host: string
  /**
   * @default 22
   */
  port?: number
  username: string
  password: string
  /**
   * remote dir
   */
  remotePath: string
  /**
   * enable backup the remote to local
   * @default false
   */
  backup?: boolean
  /**
   * url to preview after deploy
   */
  previewPath?: string
}
