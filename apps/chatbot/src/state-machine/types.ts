// ─────────────────────────────────────────────
// State Machine Types
// ─────────────────────────────────────────────

import type { IncomingMessage } from '../providers/types.js'

export type BotState =
  | 'IDLE'
  | 'GREETING'
  | 'COLLECTING_NAME'
  | 'COLLECTING_EMAIL'
  | 'COLLECTING_ADDRESS'
  | 'MAIN_MENU'
  | 'BROWSING_CATALOG'
  | 'CHECKING_AVAILABILITY'
  | 'CHECKING_ORDER_STATUS'
  | 'REQUESTING_AGENT'
  | 'WAITING_FOR_AGENT'
  | 'AGENT_ACTIVE'

export interface ResponseMessage {
  type: 'text' | 'buttons' | 'list'
  text: string
  buttons?: { id: string; title: string }[]
  sections?: {
    title: string
    rows: { id: string; title: string; description?: string }[]
  }[]
}

export type SideEffect =
  | { type: 'CREATE_CUSTOMER'; data: CreateCustomerData }
  | { type: 'UPDATE_CUSTOMER'; data: UpdateCustomerData }
  | { type: 'NOTIFY_AGENT'; conversationId: string; summary: string }
  | { type: 'CREATE_ORDER'; data: CreateOrderData }

export interface CreateCustomerData {
  phone: string
  firstName?: string
  lastName?: string
  email?: string
}

export interface UpdateCustomerData {
  customerId: string
  firstName?: string
  lastName?: string
  email?: string
  deliveryAddress?: string
  dataCollectionComplete?: boolean
}

export interface CreateOrderData {
  customerId: string
  items: { variantId: string; quantity: number }[]
  deliveryMethod: string
  deliveryAddress?: string
}

export interface StateResult {
  nextState: BotState
  responses: ResponseMessage[]
  sideEffects: SideEffect[]
}

export interface ConversationContext {
  /** Partial data being collected */
  collectingName?: string
  collectingEmail?: string
  collectingAddress?: string
  /** Current search query for availability */
  availabilityQuery?: string
  /** Agent request summary */
  agentRequestSummary?: string
  /** Buffered messages while waiting for agent */
  bufferedMessages?: string[]
}

export interface StateHandlerInput {
  message: IncomingMessage
  customerId: string
  conversationId: string
  context: ConversationContext
  customerName?: string
  isNewCustomer: boolean
}

export type StateHandler = (
  input: StateHandlerInput,
) => Promise<StateResult>
