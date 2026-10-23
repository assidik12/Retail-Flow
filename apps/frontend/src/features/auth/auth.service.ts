import demoUsers from '@/data/user.json'
import type { AuthUser, DemoUser, LoginPayload, RegisterPayload, UserRole } from './types'

const USERS_KEY = 'retail-flow-demo-users'
const SESSION_KEY = 'retail-flow-session'

const defaultRoleForUser = (username: string): UserRole =>
  username === 'budi.santoso' ? 'owner' : 'cashier'

const readUsers = (): DemoUser[] => {
  if (typeof window === 'undefined') return demoUsers as DemoUser[]
  const savedUsers = window.localStorage.getItem(USERS_KEY)
  if (!savedUsers) return demoUsers as DemoUser[]
  try {
    return (JSON.parse(savedUsers) as Partial<DemoUser>[]).map((user) => ({
      ...user,
      role: user.role ?? defaultRoleForUser(user.username ?? ''),
    })) as DemoUser[]
  } catch {
    return demoUsers as DemoUser[]
  }
}

const writeUsers = (users: DemoUser[]) => {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const getUsers = (): DemoUser[] => readUsers()

export const saveUsers = (users: DemoUser[]) => writeUsers(users)

const withoutPassword = ({ password: _password, ...user }: DemoUser): AuthUser => user

import { authApi } from '@/services/auth.api'

export const login = async ({ identifier, password }: LoginPayload): Promise<AuthUser> => {
  // 1. Coba login ke Backend Spring Boot via Axios
  try {
    const backendData = await authApi.login({
      userEmail: identifier,
      password,
    })

    const roleName = backendData.role?.toUpperCase()
    const role: UserRole = roleName === 'ADMIN' || roleName === 'OWNER' ? 'owner' : 'cashier'

    const authenticatedUser: AuthUser = {
      username: backendData.username,
      email: backendData.userEmail,
      role,
      phoneNumber: '',
      address: '',
      posCode: '',
      accessToken: backendData.accessToken,
      refreshToken: backendData.refreshToken,
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser))
    return authenticatedUser
  } catch (error: any) {
    // Jika backend offline atau credentials demo lokal
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const user = readUsers().find(
      (candidate) =>
        (candidate.username.toLowerCase() === normalizedIdentifier ||
          candidate.email.toLowerCase() === normalizedIdentifier) &&
        candidate.password === password,
    )

    if (user) {
      if (user.active === false) throw new Error('Akun ini sedang nonaktif. Hubungi owner toko.')
      const authenticatedUser = withoutPassword(user)
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser))
      return authenticatedUser
    }

    throw new Error(error?.message || 'Username/email atau kata sandi tidak sesuai.')
  }
}

export const register = async ({
  username,
  email,
  password,
  role = 'cashier',
}: RegisterPayload): Promise<AuthUser> => {
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  // 1. Coba registrasi ke Backend Spring Boot via Axios
  try {
    const backendRole = role === 'owner' ? 'OWNER' : 'CASHIER'
    const registeredUser = await authApi.register({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      phoneNumber: '08123456789',
      address: '-',
      posCode: '00000',
      role: backendRole,
    })

    const roleName = registeredUser.role?.toUpperCase()
    const parsedRole: UserRole =
      roleName === 'ADMIN' || roleName === 'OWNER' ? 'owner' : 'cashier'
    return {
      username: registeredUser.username,
      email: registeredUser.email,
      role: parsedRole,
      phoneNumber: registeredUser.phoneNumber || '',
      address: registeredUser.address || '',
      posCode: registeredUser.posCode || '',
    }
  } catch (error: any) {
    // Fallback ke local storage
    const users = readUsers()
    const alreadyExists = users.some(
      (user) =>
        user.username.toLowerCase() === normalizedUsername ||
        user.email.toLowerCase() === normalizedEmail,
    )

    if (alreadyExists) throw new Error('Username atau email sudah terdaftar.')

    const newUser: DemoUser = {
      username: normalizedUsername,
      password,
      email: normalizedEmail,
      role: 'cashier',
      phoneNumber: '',
      address: '',
      posCode: '',
    }
    writeUsers([...users, newUser])
    return withoutPassword(newUser)
  }
}

export const getSession = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  const savedSession = window.localStorage.getItem(SESSION_KEY)
  if (!savedSession) return null
  try {
    const session = JSON.parse(savedSession) as Partial<AuthUser>
    if (!session.username || !session.email) return null
    return {
      ...session,
      role: session.role ?? defaultRoleForUser(session.username),
    } as AuthUser
  } catch {
    return null
  }
}

export const logout = () => window.localStorage.removeItem(SESSION_KEY)
