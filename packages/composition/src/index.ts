/** App-facing: Nest modules, helpers, and application use cases. Do not re-export platform or infrastructure to bypass Nx tags (ADR-033). */
export {CompositionModule} from './composition.module'
export {AssertActiveMembership} from './principal/assert-active-membership'
export {WorkerModule} from './worker/worker.module'
export type {WorkerModuleAsyncOptions, WorkerRuntimeConfig} from './worker/worker.module.types'
export type {WorkerMaintenanceConfig} from './worker/worker-maintenance-config.token'
export {WORKER_MAINTENANCE_CONFIG} from './worker/worker-maintenance-config.token'
export type {WorkerOutboxConfig} from './worker/worker-outbox-config.token'
export {WORKER_OUTBOX_CONFIG} from './worker/worker-outbox-config.token'
export {
  AcceptInvitationUseCase,
  AttachMemberUseCase,
  AuthorizationService,
  CreateApiKeyUseCase,
  CreateCustomRoleUseCase,
  CreateTenantUseCase,
  CreateUserUseCase,
  DeleteCustomRoleUseCase,
  GetMyProfileQuery,
  GetTenantQuery,
  InvalidRefreshTokenError,
  InviteMemberUseCase,
  ListApiKeysQuery,
  ListRolesQuery,
  ListTenantMembersQuery,
  LoggingMailer,
  LoginUseCase,
  LogoutUseCase,
  PurgePasswordResetTokensUseCase,
  PurgeRefreshSessionsUseCase,
  PurgeStaleInvitationsUseCase,
  REFRESH_TTL_MS,
  RegisterUserUseCase,
  ReplaceMembershipRolesUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  ResolveApiKeyQuery,
  RevokeApiKeyUseCase,
  RotateRefreshUseCase,
  SelectTenantUseCase,
  SetOrChangePasswordUseCase,
  TouchApiKeyLastUsed,
  UpdateApiKeyUseCase,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/application'
