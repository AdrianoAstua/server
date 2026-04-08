// ─────────────────────────────────────────────
// WhatsApp Provider Factory
// ─────────────────────────────────────────────

import type { IWhatsAppProvider } from './types.js'

export type ProviderType = 'baileys' | 'cloud-api'

export async function createWhatsAppProvider(
  type?: ProviderType,
): Promise<IWhatsAppProvider> {
  const providerType: ProviderType =
    type ??
    (process.env['WHATSAPP_PROVIDER'] as ProviderType | undefined) ??
    'baileys'

  switch (providerType) {
    case 'baileys': {
      const { BaileysProvider } = await import('./baileys-provider.js')
      return new BaileysProvider()
    }
    case 'cloud-api': {
      const { CloudApiProvider } = await import('./cloud-api-provider.js')
      return new CloudApiProvider()
    }
    default:
      throw new Error(
        `Unknown WhatsApp provider: "${providerType}". Use "baileys" or "cloud-api".`,
      )
  }
}

export { type IWhatsAppProvider } from './types.js'
export type { IncomingMessage } from './types.js'
