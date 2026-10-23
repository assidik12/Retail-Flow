import apiClient, { type ApiResponse } from './api'

export interface ProductItem {
  id: number
  name: string
  price: number
  stock: number
}

export interface CreateProductRequest {
  name: string
  price: number
  stock: number
}

export interface UpdateProductRequest {
  name: string
  price: number
  stock: number
}

export const productApi = {
  async getAll(): Promise<ProductItem[]> {
    const res = await apiClient.get<ApiResponse<ProductItem[]>>('/products')
    return res.data.data
  },

  async getById(id: number): Promise<ProductItem> {
    const res = await apiClient.get<ApiResponse<ProductItem>>(`/products/${id}`)
    return res.data.data
  },

  async create(data: CreateProductRequest): Promise<ProductItem> {
    const res = await apiClient.post<ApiResponse<ProductItem>>('/products', data)
    return res.data.data
  },

  async update(id: number, data: UpdateProductRequest): Promise<ProductItem> {
    const res = await apiClient.put<ApiResponse<ProductItem>>(`/products/${id}`, data)
    return res.data.data
  },

  async updateStock(id: number, newStock: number): Promise<boolean> {
    const res = await apiClient.patch<ApiResponse<boolean>>(`/products/${id}/stock`, null, {
      params: { newStock },
    })
    return res.data.data
  },

  async delete(id: number): Promise<boolean> {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/products/${id}`)
    return res.data.data
  },
}
