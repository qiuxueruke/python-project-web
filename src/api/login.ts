import type { IAuthLoginRes, ICaptcha, IDoubleTokenRes, ISingleTokenRes, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http, httpPatch } from '@/http/http'
import { stringifyQuery } from '@/http/tools/queryString'

/**
 * 登录表单
 */
export interface ILoginForm {
  username: string
  password: string
}

interface IBackendToken {
  token?: string
  access_token?: string
  expiresIn?: number
  expires_in?: number
}

interface IBackendUser {
  id?: number
  userId?: number
  username: string
  nickname?: string
  email?: string
  avatar?: string
}

const FORM_URLENCODED_HEADER = {
  'Content-Type': 'application/x-www-form-urlencoded',
}

function toFormBody(data: Record<string, string | number | boolean>) {
  return stringifyQuery(data)
}

function toSingleToken(res: IBackendToken): ISingleTokenRes {
  return {
    token: res.token || res.access_token || '',
    expiresIn: res.expiresIn ?? res.expires_in ?? 24 * 60 * 60,
  }
}

function toUserInfo(res: IBackendUser): IUserInfoRes {
  return {
    ...res,
    userId: res.userId ?? res.id ?? -1,
    username: res.username,
    nickname: res.nickname || res.username,
    email: res.email,
    avatar: res.avatar,
  }
}

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCode() {
  return http.get<ICaptcha>('/user/getCode')
}

/**
 * 用户注册（x-www-form-urlencoded）
 */
export function register(loginForm: ILoginForm) {
  return http.post<IUserInfoRes>(
    '/auth/register',
    toFormBody(loginForm),
    undefined,
    FORM_URLENCODED_HEADER,
  ).then(toUserInfo)
}

/**
 * 用户登录（x-www-form-urlencoded）
 */
export function login(loginForm: ILoginForm) {
  return http.post<IBackendToken>(
    '/auth/login',
    toFormBody(loginForm),
    undefined,
    FORM_URLENCODED_HEADER,
  ).then(toSingleToken)
}

/**
 * 刷新token
 * @param refreshToken 刷新token
 */
export function refreshToken(refreshToken: string) {
  return http.post<IDoubleTokenRes>('/auth/refreshToken', { refreshToken })
}

/**
 * 获取用户信息（需 JWT）
 */
export function getUserInfo() {
  return http.get<IBackendUser>('/users/me').then(toUserInfo)
}

/**
 * 退出登录
 */
export function logout() {
  return http.post<void>('/auth/logout')
}

/**
 * 修改用户信息（需 JWT）
 */
export function updateInfo(data: IUpdateInfo) {
  return httpPatch<IBackendUser>('/users/me', data).then(toUserInfo)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>('/auth/wxLogin', data)
}
