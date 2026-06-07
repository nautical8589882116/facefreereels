import twilio from 'twilio'
import axios from 'axios'

// ─── Twilio Setup ────────────────────────────────────────────
let twilioClient: twilio.Twilio | null = null
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
}

// ─── Fast2SMS Setup (India) ──────────────────────────────────
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY

export async function sendOtpViaTwilio(phone: string, otp: string): Promise<boolean> {
  if (!twilioClient) return false
  try {
    await twilioClient.messages.create({
      body: `Your NHY-QR Ad Manager verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+${phone}`,
    })
    return true
  } catch {
    return false
  }
}

export async function sendOtpViaFast2SMS(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_API_KEY) return false
  try {
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        numbers: cleanPhone,
        message: `Your NHY-QR verification code is ${otp}. Valid for 10 mins.`,
      },
      {
        headers: { Authorization: FAST2SMS_API_KEY },
      }
    )
    return true
  } catch {
    return false
  }
}

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  // Try Fast2SMS first for Indian numbers, fallback to Twilio
  if (phone.startsWith('+91') || phone.startsWith('91')) {
    const sent = await sendOtpViaFast2SMS(phone, otp)
    if (sent) return true
  }
  return sendOtpViaTwilio(phone, otp)
}
