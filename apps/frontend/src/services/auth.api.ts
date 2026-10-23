import apiClient, { type ApiResponse } from './api'

export interface BackendUser {
  id: number
  username: string
  email: string
  role: string
  phoneNumber?: string
  address?: string
  posCode?: string
}

export interface LoginRequest {
  userEmail: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
  phoneNumber: string
  address: string
  posCode: string
  role?: string
}

export interface LoginResponseData {
  id: number
  userEmail: string
  username: string
  role: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', payload)
    return res.data.data
  },

  async register(payload: RegisterRequest): Promise<BackendUser> {
    const res = await apiClient.post<ApiResponse<BackendUser>>('/auth/register', payload)
    return res.data.data
  },

  async refresh(refreshToken: string): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/refresh', {
      refreshToken,
    })
    return res.data.data
  },
}
