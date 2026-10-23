export type UserRole = 'owner' | 'cashier'

export interface DemoUser {
  username: string
  password: string
  email: string
  role: UserRole
  fullName?: string
  phoneNumber: string
  address: string
  posCode: string
  joinedAt?: string
  active?: boolean
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  role?: UserRole
}

export type AuthUser = Omit<DemoUser, 'password'> & {
  accessToken?: string
  refreshToken?: string
}
