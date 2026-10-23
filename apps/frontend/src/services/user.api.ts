import apiClient, { type ApiResponse } from './api'
import type { BackendUser } from './auth.api'

export const userApi = {
  async getProfile(): Promise<BackendUser> {
    const res = await apiClient.get<ApiResponse<BackendUser>>('/users/me')
    return res.data.data
  },

  async getAllUsers(): Promise<BackendUser[]> {
    const res = await apiClient.get<ApiResponse<BackendUser[]>>('/users')
    return res.data.data
  },
}
