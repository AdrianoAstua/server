// ─────────────────────────────────────────────
// Baileys WhatsApp Provider (Development)
// ─────────────────────────────────────────────

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type BaileysEventMap,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import type {
  IWhatsAppProvider,
  IncomingMessage,
  MessageHandler,
  WhatsAppButton,
  WhatsAppListSection,
} from './types.js'

const logger = pino({ level: 'warn' })

export class BaileysProvider implements IWhatsAppProvider {
  private socket: WASocket | null = null
  private handlers: MessageHandler[] = []
  private readonly authDir: string

  constructor() {
    this.authDir = resolve(
      process.env['BAILEYS_AUTH_DIR'] ?? './baileys-auth',
    )
  }

  async initialize(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir)
    const { version } = await fetchLatestBaileysVersion()

    this.socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: true,
      generateHighQualityLinkPreview: false,
    })

    this.socket.ev.on('creds.update', saveCreds)

    this.socket.ev.on(
      'connection.update',
      (update: BaileysEventMap['connection.update']) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })
            ?.output?.statusCode
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          if (shouldReconnect) {
            logger.info('Reconnecting to WhatsApp...')
            void this.initialize()
          } else {
            logger.info('Logged out from WhatsApp')
          }
        }

        if (connection === 'open') {
          logger.info('Connected to WhatsApp via Baileys')
        }
      },
    )

    this.socket.ev.on(
      'messages.upsert',
      (upsert: BaileysEventMap['messages.upsert']) => {
        if (upsert.type !== 'notify') return

        for (const msg of upsert.messages) {
          if (!msg.message || msg.key.fromMe) continue

          const parsed = this.parseMessage(msg)
          if (!parsed) continue

          for (const handler of this.handlers) {
            void Promise.resolve(handler(parsed)).catch((err: unknown) => {
              logger.error({ err }, 'Message handler error')
            })
          }
        }
      },
    )
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    this.ensureConnected()
    const jid = this.toJid(to)
    const sent = await this.socket!.sendMessage(jid, { text })
    return sent?.key.id ?? randomUUID()
  }

  async sendButtonMessage(
    to: string,
    text: string,
    buttons: WhatsAppButton[],
  ): Promise<string> {
    this.ensureConnected()
    const jid = this.toJid(to)

    // Baileys button support is limited; fall back to numbered text
    const buttonText = buttons
      .map((b, i) => `${i + 1}. ${b.title}`)
      .join('\n')
    const fullText = `${text}\n\n${buttonText}`

    const sent = await this.socket!.sendMessage(jid, { text: fullText })
    return sent?.key.id ?? randomUUID()
  }

  async sendListMessage(
    to: string,
    text: string,
    sections: WhatsAppListSection[],
  ): Promise<string> {
    this.ensureConnected()
    const jid = this.toJid(to)

    // Baileys list support is limited; fall back to formatted text
    let listText = text + '\n'
    for (const section of sections) {
      listText += `\n*${section.title}*\n`
      for (const row of section.rows) {
        listText += `- ${row.title}`
        if (row.description) listText += ` — ${row.description}`
        listText += '\n'
      }
    }

    const sent = await this.socket!.sendMessage(jid, { text: listText })
    return sent?.key.id ?? randomUUID()
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler)
  }

  async shutdown(): Promise<void> {
    if (this.socket) {
      this.socket.end(undefined)
      this.socket = null
    }
  }

  // ── Private helpers ──────────────────────────

  private ensureConnected(): void {
    if (!this.socket) {
      throw new Error('Baileys provider not initialized')
    }
  }

  private toJid(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '')
    return `${cleaned}@s.whatsapp.net`
  }

  private parseMessage(
    msg: { key: { remoteJid?: string | null; id?: string | null }; message?: Record<string, unknown> | null; messageTimestamp?: number | Long.Long | null },
  ): IncomingMessage | null {
    const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
    if (!from || from.includes('@g.us')) return null

    const messageId = msg.key.id ?? randomUUID()
    const timestamp = new Date(
      Number(msg.messageTimestamp ?? 0) * 1000,
    )
    const message = msg.message

    if (!message) return null

    // Text message
    const conversation = message['conversation'] as string | undefined
    const extendedText = message['extendedTextMessage'] as { text?: string } | undefined
    const text = conversation ?? extendedText?.text

    if (text) {
      return { from, text, type: 'text', messageId, timestamp }
    }

    // Button response
    const buttonResponse = message['buttonsResponseMessage'] as { selectedButtonId?: string; selectedDisplayText?: string } | undefined
    if (buttonResponse) {
      return {
        from,
        text: buttonResponse.selectedDisplayText ?? '',
        type: 'button_response',
        messageId,
        timestamp,
        buttonResponseId: buttonResponse.selectedButtonId,
      }
    }

    // List response
    const listResponse = message['listResponseMessage'] as { singleSelectReply?: { selectedRowId?: string }; title?: string } | undefined
    if (listResponse) {
      return {
        from,
        text: listResponse.title ?? '',
        type: 'list_response',
        messageId,
        timestamp,
        listResponseId: listResponse.singleSelectReply?.selectedRowId,
      }
    }

    return null
  }
}
