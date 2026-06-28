import 'dotenv/config'
import { sendStaffNotificationEmail } from '../services/email.js'

const to = process.argv[2] ?? 'stitch-ats@outlook.com'

const key = (process.env.RESEND_API_KEY ?? '').trim()
console.log(
  JSON.stringify({
    resendKeyLoaded: Boolean(key),
    resendKeyLength: key.length,
    resendKeyLooksComplete: key.startsWith('re_') && key.length >= 51,
  })
)

const result = await sendStaffNotificationEmail({
  to,
  recipientName: 'Stitch ATS',
  subject: 'Stitch ATS — test email',
  headline: 'Test email',
  body: 'This is a test message from Stitch ATS. If you received this, email delivery is working correctly.',
})

console.log(JSON.stringify(result, null, 2))
process.exit(result.sent ? 0 : 1)
