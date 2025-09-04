export const sendTelegramMessage = async (text: string) => {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID

  // Debug: Log environment variables (without exposing sensitive data)
  console.log('🔍 Telegram Debug:', {
    hasBotToken: !!botToken,
    hasChatId: !!chatId,
    environment: typeof window !== 'undefined' ? 'client' : 'server'
  })

  if (!botToken || !chatId) {
    console.error('❌ Telegram: Token oder Chat-ID fehlt!')
    console.error('🔧 Lösung: Fügen Sie die Umgebungsvariablen in Vercel hinzu:')
    console.error('   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN')
    console.error('   NEXT_PUBLIC_TELEGRAM_CHAT_ID')
    return
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    console.log('✅ Telegram-Nachricht erfolgreich gesendet')
  } catch (error) {
    console.error('❌ Telegram-Fehler:', error)
  }
}
