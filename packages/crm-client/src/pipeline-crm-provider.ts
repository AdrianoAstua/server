import { request as undiciRequest } from 'undici'
import pino from 'pino'
import type {
  ICRMProvider,
  CreateDealInput,
  UpdateDealInput,
  CreatePersonInput,
  UpdatePersonInput,
  DealFilters,
  CRMDeal,
  CRMPerson,
  CRMStage,
} from './interfaces.js'
import { CRMError, CRMRateLimitError } from './interfaces.js'

// ─────────────────────────────────────────────
// Pipeline CRM API response shapes
// ─────────────────────────────────────────────

interface PipelineDealResponse {
  id: number
  name: string
  value: number | null
  primary_contact_id: number | null
  deal_stage_id: number | null
  status: number
  created_at: string
  updated_at: string
  custom_fields: Record<string, unknown>
  deal_stage?: { id: number; name: string }
}

interface PipelinePersonResponse {
  id: number
  first_name: string
  last_name: string | null
  phone: string | null
  email: string | null
  tags: Array<{ name: string }> | null
  created_at: string
  updated_at: string
}

interface PipelineStageResponse {
  id: number
  name: string
  position: number
  pipeline_id: number
}

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

const BASE_URL = 'https://api.pipelinecrm.com/api/v3'
const REQUEST_TIMEOUT_MS = 10_000
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1_000

export interface PipelineCRMConfig {
  apiKey: string
  logger?: pino.Logger
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export class PipelineCRMProvider implements ICRMProvider {
  private readonly apiKey: string
  private readonly log: pino.Logger
  private stageCache: CRMStage[] | null = null
  private stageCacheExpiry = 0

  constructor(config: PipelineCRMConfig) {
    this.apiKey = config.apiKey
    this.log = (config.logger ?? pino({ level: 'info' })).child({
      module: 'pipeline-crm',
    })
  }

  // ── HTTP helper ─────────────────────────────

  private async apiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`)
    url.searchParams.set('api_key', this.apiKey)

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await undiciRequest(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          headersTimeout: REQUEST_TIMEOUT_MS,
          bodyTimeout: REQUEST_TIMEOUT_MS,
        })

        const status = response.statusCode
        const responseBody = await response.body.text()

        if (status === 429) {
          const retryHeader = response.headers['retry-after']
          const retryMs = retryHeader
            ? Number(retryHeader) * 1_000
            : 60_000
          throw new CRMRateLimitError(retryMs)
        }

        if (status >= 400) {
          const retryable = status >= 500
          throw new CRMError(
            `Pipeline CRM ${method} ${path} returned ${status}: ${responseBody.slice(0, 200)}`,
            status,
            retryable,
          )
        }

        return JSON.parse(responseBody) as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        const isRetryable =
          error instanceof CRMRateLimitError ||
          (error instanceof CRMError && error.retryable) ||
          !(error instanceof CRMError)

        if (!isRetryable || attempt === MAX_RETRIES) {
          this.log.error(
            { err: lastError, method, path, attempt },
            'CRM API call failed (no more retries)',
          )
          throw lastError
        }

        const backoffMs =
          error instanceof CRMRateLimitError
            ? error.retryAfterMs
            : BACKOFF_BASE_MS * 2 ** (attempt - 1)

        this.log.warn(
          { method, path, attempt, backoffMs },
          'CRM API call failed, retrying',
        )

        await this.sleep(backoffMs)
      }
    }

    throw lastError ?? new CRMError('Unexpected retry exhaustion', 500, false)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ── Deals ───────────────────────────────────

  async createDeal(data: CreateDealInput): Promise<CRMDeal> {
    const payload: Record<string, unknown> = {
      deal: {
        name: data.name,
        value: data.valueCents / 100,
        primary_contact_id: data.personId ? Number(data.personId) : undefined,
        deal_stage_id: data.stageId ? Number(data.stageId) : undefined,
        custom_fields: data.customFields ?? {},
        source_id: data.source,
        expected_close_date: data.expectedCloseDate,
      },
    }

    const raw = await this.apiCall<PipelineDealResponse>('POST', '/deals', payload)
    return this.mapDeal(raw)
  }

  async updateDeal(dealId: string, data: UpdateDealInput): Promise<CRMDeal> {
    const dealPayload: Record<string, unknown> = {}
    if (data.name !== undefined) dealPayload['name'] = data.name
    if (data.valueCents !== undefined) dealPayload['value'] = data.valueCents / 100
    if (data.stageId !== undefined) dealPayload['deal_stage_id'] = Number(data.stageId)
    if (data.customFields !== undefined) dealPayload['custom_fields'] = data.customFields

    const raw = await this.apiCall<PipelineDealResponse>(
      'PUT',
      `/deals/${dealId}`,
      { deal: dealPayload },
    )
    return this.mapDeal(raw)
  }

  async updateDealStage(dealId: string, stageId: string): Promise<CRMDeal> {
    return this.updateDeal(dealId, { stageId })
  }

  async getDeal(dealId: string): Promise<CRMDeal> {
    const raw = await this.apiCall<PipelineDealResponse>('GET', `/deals/${dealId}`)
    return this.mapDeal(raw)
  }

  async listDeals(filters?: DealFilters): Promise<CRMDeal[]> {
    const params: string[] = []
    if (filters?.stageId) params.push(`deal_stage_id=${filters.stageId}`)
    if (filters?.personId) params.push(`primary_contact_id=${filters.personId}`)
    if (filters?.search) params.push(`search=${encodeURIComponent(filters.search)}`)
    if (filters?.page) params.push(`page=${filters.page}`)
    if (filters?.perPage) params.push(`per_page=${filters.perPage}`)

    const query = params.length > 0 ? `?${params.join('&')}` : ''
    const raw = await this.apiCall<{ entries: PipelineDealResponse[] }>(
      'GET',
      `/deals${query}`,
    )
    return (raw.entries ?? []).map((d) => this.mapDeal(d))
  }

  // ── People ──────────────────────────────────

  async createPerson(data: CreatePersonInput): Promise<CRMPerson> {
    const payload: Record<string, unknown> = {
      person: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        custom_fields: data.customFields ?? {},
      },
    }

    const raw = await this.apiCall<PipelinePersonResponse>('POST', '/people', payload)
    return this.mapPerson(raw)
  }

  async updatePerson(personId: string, data: UpdatePersonInput): Promise<CRMPerson> {
    const personPayload: Record<string, unknown> = {}
    if (data.firstName !== undefined) personPayload['first_name'] = data.firstName
    if (data.lastName !== undefined) personPayload['last_name'] = data.lastName
    if (data.phone !== undefined) personPayload['phone'] = data.phone
    if (data.email !== undefined) personPayload['email'] = data.email
    if (data.customFields !== undefined) personPayload['custom_fields'] = data.customFields

    const raw = await this.apiCall<PipelinePersonResponse>(
      'PUT',
      `/people/${personId}`,
      { person: personPayload },
    )
    return this.mapPerson(raw)
  }

  async findPersonByPhone(phone: string): Promise<CRMPerson | null> {
    const raw = await this.apiCall<{ entries: PipelinePersonResponse[] }>(
      'GET',
      `/people?search=${encodeURIComponent(phone)}`,
    )

    const entries = raw.entries ?? []
    const match = entries.find((p) => p.phone === phone)
    return match ? this.mapPerson(match) : null
  }

  async getPerson(personId: string): Promise<CRMPerson> {
    const raw = await this.apiCall<PipelinePersonResponse>('GET', `/people/${personId}`)
    return this.mapPerson(raw)
  }

  // ── Stages ──────────────────────────────────

  async getStages(): Promise<CRMStage[]> {
    const now = Date.now()
    if (this.stageCache && now < this.stageCacheExpiry) {
      return this.stageCache
    }

    const raw = await this.apiCall<PipelineStageResponse[]>(
      'GET',
      '/deal_stages',
    )

    this.stageCache = (raw ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
      position: s.position,
      pipelineId: String(s.pipeline_id),
    }))

    // Cache for 5 minutes
    this.stageCacheExpiry = now + 5 * 60 * 1_000
    return this.stageCache
  }

  // ── Connection test ─────────────────────────

  async testConnection(): Promise<boolean> {
    try {
      await this.apiCall<unknown>('GET', '/deal_stages')
      return true
    } catch {
      return false
    }
  }

  // ── Mappers ─────────────────────────────────

  private mapDeal(raw: PipelineDealResponse): CRMDeal {
    return {
      id: String(raw.id),
      name: raw.name,
      valueCents: Math.round((raw.value ?? 0) * 100),
      currency: 'CRC',
      stageId: String(raw.deal_stage_id ?? ''),
      stageName: raw.deal_stage?.name ?? '',
      personId: raw.primary_contact_id ? String(raw.primary_contact_id) : null,
      status: String(raw.status),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      customFields: raw.custom_fields ?? {},
    }
  }

  private mapPerson(raw: PipelinePersonResponse): CRMPerson {
    return {
      id: String(raw.id),
      firstName: raw.first_name,
      lastName: raw.last_name,
      phone: raw.phone,
      email: raw.email,
      tags: (raw.tags ?? []).map((t) => t.name),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    }
  }
}
