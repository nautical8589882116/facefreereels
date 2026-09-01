export const DEMO_LOGIN_PHONE = '+919876543210'
export const DEMO_LOGIN_CODE = '000000'

export function isDemoPhone(phone: string): boolean {
  return phone === DEMO_LOGIN_PHONE
}

export function isDemoLogin(phone: string, code: string): boolean {
  return isDemoPhone(phone) && code === DEMO_LOGIN_CODE
}
