// ─────────────────────────────────────────────
// CRM Provider Interface — framework-agnostic
// ─────────────────────────────────────────────

/** Input to create a deal in CRM */
export interface CreateDealInput {
  name: string
  valueCents: number
  currency: string
  personId?: string
  stageId?: string
  customFields?: Record<string, unknown>
  source?: string
  expectedCloseDate?: string
}

/** Input to update an existing deal */
export interface UpdateDealInput {
  name?: string
  valueCents?: number
  stageId?: string
  customFields?: Record<string, unknown>
  status?: string
}

/** Input to create a person in CRM */
export interface CreatePersonInput {
  firstName: string
  lastName?: string
  phone: string
  email?: string
  tags?: string[]
  customFields?: Record<string, unknown>
}

/** Input to update a person in CRM */
export interface UpdatePersonInput {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  tags?: string[]
  customFields?: Record<string, unknown>
}

/** Filters for listing deals */
export interface DealFilters {
  stageId?: string
  personId?: string
  search?: string
  page?: number
  perPage?: number
}

/** CRM Deal representation */
export interface CRMDeal {
  id: string
  name: string
  valueCents: number
  currency: string
  stageId: string
  stageName: string
  personId: string | null
  status: string
  createdAt: string
  updatedAt: string
  customFields: Record<string, unknown>
}

/** CRM Person representation */
export interface CRMPerson {
  id: string
  firstName: string
  lastName: string | null
  phone: string | null
  email: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** CRM Stage representation */
export interface CRMStage {
  id: string
  name: string
  position: number
  pipelineId: string
}

/** Provider interface — implement per CRM vendor */
export interface ICRMProvider {
  createDeal(data: CreateDealInput): Promise<CRMDeal>
  updateDeal(dealId: string, data: UpdateDealInput): Promise<CRMDeal>
  updateDealStage(dealId: string, stageId: string): Promise<CRMDeal>
  getDeal(dealId: string): Promise<CRMDeal>
  listDeals(filters?: DealFilters): Promise<CRMDeal[]>
  createPerson(data: CreatePersonInput): Promise<CRMPerson>
  updatePerson(personId: string, data: UpdatePersonInput): Promise<CRMPerson>
  findPersonByPhone(phone: string): Promise<CRMPerson | null>
  getPerson(personId: string): Promise<CRMPerson>
  getStages(): Promise<CRMStage[]>
  testConnection(): Promise<boolean>
}

/** Errors specific to CRM operations */
export class CRMError extends Error {
  public readonly statusCode: number
  public readonly retryable: boolean

  constructor(message: string, statusCode: number, retryable = false) {
    super(message)
    this.name = 'CRMError'
    this.statusCode = statusCode
    this.retryable = retryable
  }
}

export class CRMRateLimitError extends CRMError {
  public readonly retryAfterMs: number

  constructor(retryAfterMs = 60_000) {
    super('CRM rate limit exceeded', 429, true)
    this.name = 'CRMRateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}
