import type {INestApplication} from '@nestjs/common'
import {VersioningType} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import request from 'supertest'
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {PermissionName} from '@b2b-saas-starter-kit/contracts'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'

import {LoggingMailer} from '@b2b-saas-starter-kit/composition'
import type {PostgresTestDatabase} from '@b2b-saas-starter-kit/composition/testing'
import {flushRedis, preparePostgresTestDatabase, seedActiveMembership} from '@b2b-saas-starter-kit/composition/testing'

import {applyCookieParser} from '@b2b-saas-starter-kit/nest-http'

import {AppModule} from '../src/app/app.module'
import {AuthRateLimits} from '../src/common/auth/rate-limit/auth-rate-limits'

describe('HTTP e2e', () => {
  let app: INestApplication
  let database: PostgresTestDatabase

  beforeAll(async () => {
    database = await preparePostgresTestDatabase()
    LoggerLocator.init(new PinoLogger({level: 'error', isPretty: false}))
    app = await NestFactory.create(AppModule, {logger: false, abortOnError: false})
    applyCookieParser(app)
    app.enableVersioning({type: VersioningType.URI, defaultVersion: '1'})
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
    await database?.destroy()
    LoggerLocator.reset()
  })

  beforeEach(async () => {
    await database.truncate()
    await flushRedis(app)
  })

  it('creates a user, tenant, and returns owner permissions on /v1/me', async () => {
    const createdUser = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'ada@example.com', displayName: 'Ada'})
      .expect(201)

    expect(createdUser.headers['x-request-id']).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))

    const userId = UserId.parse(createdUser.body.id)

    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', userId)
      .send({name: 'Acme'})
      .expect(201)

    const tenantId = TenantId.parse(createdTenant.body.id)

    const me = await request(app.getHttpServer())
      .get('/v1/me')
      .set('x-user-id', userId)
      .set('x-tenant-id', tenantId)
      .expect(200)

    expect(me.body.user.id).toBe(userId)
    expect(me.body.effectivePermissions).toEqual(
      expect.arrayContaining([
        PermissionName.tenancyMembersRead,
        PermissionName.tenancyMembersInvite,
        PermissionName.tenancyMembersManage,
        PermissionName.tenancyTenantRead,
        PermissionName.authorizationRolesRead,
        PermissionName.authorizationRolesManage,
        PermissionName.identityUsersRead,
      ]),
    )
    expect(me.body.effectivePermissions).toHaveLength(7)

    const members = await request(app.getHttpServer())
      .get(`/v1/tenants/${tenantId}/members`)
      .set('x-user-id', userId)
      .set('x-tenant-id', tenantId)
      .expect(200)

    expect(members.body.members).toHaveLength(1)
    expect(members.body.members[0].userId).toBe(userId)
  })

  it('rejects invalid create-user payloads with a validation envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'not-an-email', displayName: 'Ada'})
      .expect(400)

    expect(response.body.code).toBe('VALIDATION_ERROR')
  })

  it('denies a member principal on GET /v1/tenants/:id/members', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const member = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'member@example.com', displayName: 'Member'})
      .expect(201)

    const ownerId = UserId.parse(owner.body.id)
    const memberId = UserId.parse(member.body.id)

    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)

    const tenantId = TenantId.parse(createdTenant.body.id)
    const memberRoleId = RoleId.parse(createdTenant.body.roleIds.member)

    await seedActiveMembership(app, {userId: memberId, tenantId, roleId: memberRoleId})

    const response = await request(app.getHttpServer())
      .get(`/v1/tenants/${tenantId}/members`)
      .set('x-user-id', memberId)
      .set('x-tenant-id', tenantId)
      .expect(403)

    expect(response.body.code).toBe('INSUFFICIENT_PERMISSION')
  })

  it('rejects protected routes without x-user-id', async () => {
    const response = await request(app.getHttpServer()).post('/v1/tenants').send({name: 'Acme'}).expect(401)

    expect(response.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 when creating a tenant for an unknown owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', '00000000-0000-4000-8000-000000000001')
      .send({name: 'Acme'})
      .expect(404)

    expect(response.body.code).toBe('OWNER_USER_NOT_FOUND')
  })

  it('registers, logs in via cookie, refreshes the cookie, selects a tenant, and calls /me with Bearer only', async () => {
    const agent = request.agent(app.getHttpServer())

    const registered = await agent
      .post('/v1/auth/register')
      .send({email: 'ada@example.com', displayName: 'Ada', password: 'secret-password'})
      .expect(201)

    const userId = UserId.parse(registered.body.userId)
    const login = await agent
      .post('/v1/auth/web/login')
      .send({email: 'ada@example.com', password: 'secret-password'})
      .expect(200)

    expect(login.body.userId).toBe(userId)
    expect(login.body.tenantId).toBeUndefined()
    expect(login.body.refreshToken).toBeUndefined()
    expect(login.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('refresh_token=')]))

    const createdTenant = await agent
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({name: 'Acme'})
      .expect(201)

    const tenantId = TenantId.parse(createdTenant.body.id)
    const refreshed = await agent.post('/v1/auth/web/refresh').expect(200)

    expect(refreshed.body.userId).toBe(userId)
    expect(refreshed.body.accessToken).toBeTruthy()
    expect(refreshed.body.refreshToken).toBeUndefined()

    const selected = await agent
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .send({tenantId})
      .expect(200)

    expect(selected.body.tenantId).toBe(tenantId)

    const me = await agent.get('/v1/me').set('Authorization', `Bearer ${selected.body.accessToken}`).expect(200)

    expect(me.body.user.id).toBe(userId)

    const members = await agent
      .get(`/v1/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${selected.body.accessToken}`)
      .expect(200)

    expect(members.body.members).toHaveLength(1)
    expect(members.body.members[0].userId).toBe(userId)
  })

  it('logs in with a body refresh token, rotates it, and logs out without cookies', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({email: 'mel@example.com', displayName: 'Mel', password: 'secret-password'})
      .expect(201)

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({email: 'mel@example.com', password: 'secret-password'})
      .expect(200)

    expect(login.body.refreshToken).toBeTruthy()
    expect(login.headers['set-cookie']).toBeUndefined()

    const refreshed = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({refreshToken: login.body.refreshToken})
      .expect(200)

    expect(refreshed.body.refreshToken).toBeTruthy()
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken)
    expect(refreshed.body.accessToken).toBeTruthy()

    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({name: 'Mel Co'})
      .expect(201)

    const selected = await request(app.getHttpServer())
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .send({tenantId: createdTenant.body.id})
      .expect(200)

    const me = await request(app.getHttpServer())
      .get('/v1/me')
      .set('Authorization', `Bearer ${selected.body.accessToken}`)
      .expect(200)

    expect(me.body.user.email).toBe('mel@example.com')

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({refreshToken: refreshed.body.refreshToken})
      .expect(200)

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({refreshToken: refreshed.body.refreshToken})
      .expect(401)
  })

  it('rate-limits native login after the window is exhausted', async () => {
    const payload = {email: 'nobody@example.com', password: 'wrong-password'}

    for (let attempt = 0; attempt < AuthRateLimits.login.limit; attempt += 1) {
      await request(app.getHttpServer()).post('/v1/auth/login').send(payload).expect(401)
    }

    const limited = await request(app.getHttpServer()).post('/v1/auth/login').send(payload).expect(429)

    expect(limited.body).toMatchObject({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    })
    expect(limited.headers['retry-after']).toEqual(expect.stringMatching(/^\d+$/))
  })

  it('lets Owner invite by email, accept as a new user, and call /me in the tenant', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const ownerId = UserId.parse(owner.body.id)
    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)
    const tenantId = TenantId.parse(createdTenant.body.id)
    const memberRoleId = RoleId.parse(createdTenant.body.roleIds.member)
    const mailer = app.get(LoggingMailer)

    mailer.messages.length = 0

    await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/invitations`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .send({email: 'invited@example.com', roleIds: [memberRoleId]})
      .expect(201)

    const token = mailer.messages.at(-1)?.text.replace('invitation token: ', '')

    expect(token).toBeTruthy()

    const accepted = await request(app.getHttpServer())
      .post('/v1/invitations/accept')
      .send({token, displayName: 'Invited', password: 'secret-password'})
      .expect(201)

    const me = await request(app.getHttpServer())
      .get('/v1/me')
      .set('x-user-id', accepted.body.userId)
      .set('x-tenant-id', tenantId)
      .expect(200)

    expect(me.body.user.email).toBe('invited@example.com')
    expect(me.body.effectivePermissions).toEqual([PermissionName.tenancyTenantRead])
  })

  it('attaches an existing user as an active member', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const existing = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'existing@example.com', displayName: 'Existing'})
      .expect(201)
    const ownerId = UserId.parse(owner.body.id)
    const existingId = UserId.parse(existing.body.id)
    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)
    const tenantId = TenantId.parse(createdTenant.body.id)
    const memberRoleId = RoleId.parse(createdTenant.body.roleIds.member)

    await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/members`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .send({userId: existingId, roleIds: [memberRoleId]})
      .expect(201)

    const members = await request(app.getHttpServer())
      .get(`/v1/tenants/${tenantId}/members`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .expect(200)

    expect(members.body.members).toHaveLength(2)
  })

  it('denies a Member on POST invitations', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const member = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'member@example.com', displayName: 'Member'})
      .expect(201)
    const ownerId = UserId.parse(owner.body.id)
    const memberId = UserId.parse(member.body.id)
    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)
    const tenantId = TenantId.parse(createdTenant.body.id)
    const memberRoleId = RoleId.parse(createdTenant.body.roleIds.member)

    await seedActiveMembership(app, {userId: memberId, tenantId, roleId: memberRoleId})

    const response = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/invitations`)
      .set('x-user-id', memberId)
      .set('x-tenant-id', tenantId)
      .send({email: 'new@example.com', roleIds: [memberRoleId]})
      .expect(403)

    expect(response.body.code).toBe('INSUFFICIENT_PERMISSION')
  })

  it('lets Owner create a custom role and denies Admin on POST roles', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const admin = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'admin@example.com', displayName: 'Admin'})
      .expect(201)
    const ownerId = UserId.parse(owner.body.id)
    const adminId = UserId.parse(admin.body.id)
    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)
    const tenantId = TenantId.parse(createdTenant.body.id)
    const adminRoleId = RoleId.parse(createdTenant.body.roleIds.admin)

    await seedActiveMembership(app, {userId: adminId, tenantId, roleId: adminRoleId})

    await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/roles`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .send({name: 'Reviewer', permissions: [PermissionName.tenancyTenantRead]})
      .expect(201)

    const response = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/roles`)
      .set('x-user-id', adminId)
      .set('x-tenant-id', tenantId)
      .send({name: 'Auditor', permissions: [PermissionName.tenancyTenantRead]})
      .expect(403)

    expect(response.body.code).toBe('INSUFFICIENT_PERMISSION')
  })

  it('denies GET tenant for a custom role without tenant.read', async () => {
    const owner = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'owner@example.com', displayName: 'Owner'})
      .expect(201)
    const guest = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'guest@example.com', displayName: 'Guest'})
      .expect(201)
    const ownerId = UserId.parse(owner.body.id)
    const guestId = UserId.parse(guest.body.id)
    const createdTenant = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('x-user-id', ownerId)
      .send({name: 'Acme'})
      .expect(201)
    const tenantId = TenantId.parse(createdTenant.body.id)

    const createdRole = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/roles`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .send({name: 'Auditor', permissions: [PermissionName.identityUsersRead]})
      .expect(201)

    await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/members`)
      .set('x-user-id', ownerId)
      .set('x-tenant-id', tenantId)
      .send({userId: guestId, roleIds: [createdRole.body.id]})
      .expect(201)

    const response = await request(app.getHttpServer())
      .get(`/v1/tenants/${tenantId}`)
      .set('x-user-id', guestId)
      .set('x-tenant-id', tenantId)
      .expect(403)

    expect(response.body.code).toBe('INSUFFICIENT_PERMISSION')
  })

  it('sets a password on a password-less user, then changes it', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'nopw@example.com', displayName: 'No Password'})
      .expect(201)
    const userId = UserId.parse(created.body.id)

    await request(app.getHttpServer())
      .post('/v1/auth/password')
      .set('x-user-id', userId)
      .send({password: 'secret-password'})
      .expect(200)

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({email: 'nopw@example.com', password: 'secret-password'})
      .expect(200)

    expect(login.body.userId).toBe(userId)

    await request(app.getHttpServer())
      .post('/v1/auth/password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({password: 'next-password', currentPassword: 'secret-password'})
      .expect(200)

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({email: 'nopw@example.com', password: 'next-password'})
      .expect(200)
  })
})
