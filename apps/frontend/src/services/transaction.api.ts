import apiClient, { type ApiResponse } from './api'

export interface CreateTransactionRequest {
  productId: number
  quantity: number
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT'
  amountPaid?: number
  paidAmount?: number
  userEmail?: string
}

export interface TransactionDetailResponseData {
  id: number
  transactionId: string
  productId: number
  productName?: string
  quantity: number
  totalPriceProduct: number
  formattedTotalPriceProduct?: string
}

export interface TransactionResponseData {
  transactionId: string
  userEmail: string
  productId?: number
  quantity?: number
  totalAmount?: number
  totalPriceAmount?: number
  formattedTotalPriceAmount?: string
  paidAmount?: number
  changeAmount?: number
  paymentMethod: string
  status: 'PAID' | 'CANCELLED' | 'PENDING' | 'FAILED' | boolean | string
  date: string
  details?: TransactionDetailResponseData[]
}

export const transactionApi = {
  async create(data: CreateTransactionRequest): Promise<TransactionResponseData> {
    const res = await apiClient.post<ApiResponse<TransactionResponseData>>('/transactions', data)
    return res.data.data
  },

  async getAll(email?: string): Promise<TransactionResponseData[]> {
    const res = await apiClient.get<ApiResponse<TransactionResponseData[]>>('/transactions', {
      params: email ? { email } : undefined,
    })
    return res.data.data
  },

  async getDetails(email?: string): Promise<TransactionDetailResponseData[]> {
    const res = await apiClient.get<ApiResponse<TransactionDetailResponseData[]>>(
      '/transactions/details',
      {
        params: email ? { email } : undefined,
      },
    )
    return res.data.data
  },

  async getById(id: string): Promise<TransactionResponseData> {
    const res = await apiClient.get<ApiResponse<TransactionResponseData>>(`/transactions/${id}`)
    return res.data.data
  },

  async updateStatus(id: string, status: 'PAID' | 'CANCELLED' | 'PENDING'): Promise<TransactionResponseData> {
    const res = await apiClient.patch<ApiResponse<TransactionResponseData>>(`/transactions/${id}/status`, { status })
    return res.data.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/transactions/${id}`)
  },
}
