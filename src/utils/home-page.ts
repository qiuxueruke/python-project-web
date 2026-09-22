import type { PageMetaDatum } from '@uni-helper/vite-plugin-uni-pages'
import { pages } from '@/pages.json'

/**
 * 首页路径，通过 pages.json 里 type 为 home 的页面获取；没有则取第一个页面。
 * 单独抽文件，避免 tabbar/store ↔ utils/index 循环依赖（HOME_PAGE 在模块初始化阶段就会被读）。
 */
export const HOME_PAGE = `/${(pages as PageMetaDatum[]).find(page => page.type === 'home')?.path || (pages as PageMetaDatum[])[0].path}`
