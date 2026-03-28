import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

function getFromAddress(fromName: string) {
  const configuredAddress = process.env.RESEND_FROM_EMAIL

  if (configuredAddress) {
    return `${fromName} <${configuredAddress}>`
  }

  return `${fromName} <onboarding@resend.dev>`
}

interface SendOutreachEmailParams {
  to: string
  subject: string
  body: string
  fromName?: string
}

export async function sendOutreachEmail(params: SendOutreachEmailParams) {
  const { to, subject, body, fromName = "Influencer Finder" } = params

  const { data, error } = await getResend().emails.send({
    from: getFromAddress(fromName),
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${body.replace(/\n/g, "<br>")}
        <br><br>
        <hr style="border: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Enviado via Influencer Finder
        </p>
      </div>
    `,
    text: body,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

interface SendWelcomeEmailParams {
  to: string
  name: string
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  const { to, name } = params

  await getResend().emails.send({
    from: getFromAddress("Influencer Finder"),
    to,
    subject: "Bem-vindo ao Influencer Finder!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6C63FF;">Bem-vindo, ${name}!</h1>
        <p>Sua conta no Influencer Finder foi criada com sucesso.</p>
        <p>Você está no plano <strong>Gratuito</strong> com 3 buscas disponíveis.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="background: #6C63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Acessar Dashboard
        </a>
      </div>
    `,
  })
}

interface SendPasswordResetParams {
  to: string
  resetLink: string
}

export async function sendPasswordResetEmail(params: SendPasswordResetParams) {
  const { to, resetLink } = params

  await getResend().emails.send({
    from: getFromAddress("Influencer Finder"),
    to,
    subject: "Redefinir sua senha",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1A1A2E;">Redefinir Senha</h1>
        <p>Você solicitou a redefinição de senha. Clique no botão abaixo:</p>
        <a href="${resetLink}"
           style="background: #6C63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Redefinir Senha
        </a>
        <p style="color: #999; margin-top: 24px; font-size: 14px;">
          Se você não solicitou isso, ignore este email.
        </p>
      </div>
    `,
  })
}
