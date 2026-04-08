// ─────────────────────────────────────────────
// WhatsApp Provider Interface
// ─────────────────────────────────────────────

export interface WhatsAppButton {
  id: string
  title: string
}

export interface WhatsAppListRow {
  id: string
  title: string
  description?: string
}

export interface WhatsAppListSection {
  title: string
  rows: WhatsAppListRow[]
}

export interface IncomingMessage {
  from: string
  text: string
  type: 'text' | 'button_response' | 'list_response' | 'image' | 'location'
  messageId: string
  timestamp: Date
  buttonResponseId?: string
  listResponseId?: string
  imageUrl?: string
  location?: { latitude: number; longitude: number }
}

export type MessageHandler = (msg: IncomingMessage) => void | Promise<void>

export interface IWhatsAppProvider {
  initialize(): Promise<void>
  sendTextMessage(to: string, text: string): Promise<string>
  sendButtonMessage(
    to: string,
    text: string,
    buttons: WhatsAppButton[],
  ): Promise<string>
  sendListMessage(
    to: string,
    text: string,
    sections: WhatsAppListSection[],
  ): Promise<string>
  onMessage(handler: MessageHandler): void
  shutdown(): Promise<void>
}
