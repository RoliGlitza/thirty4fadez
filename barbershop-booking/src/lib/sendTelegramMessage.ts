export const sendTelegramMessage = async (text: string) => {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('Telegram: Token oder Chat-ID fehlt!')
    return
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    })
  } catch (error) {
    console.error('Telegram-Fehler:', error)
  }
}
