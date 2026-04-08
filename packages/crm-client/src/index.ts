// ─────────────────────────────────────────────
// V ONE B — Pipeline CRM Client
// ─────────────────────────────────────────────

export type {
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

export { CRMError, CRMRateLimitError } from './interfaces.js'

export { PipelineCRMProvider } from './pipeline-crm-provider.js'
export type { PipelineCRMConfig } from './pipeline-crm-provider.js'

export { CRMSyncService, getCRMSyncService } from './crm-sync-service.js'
