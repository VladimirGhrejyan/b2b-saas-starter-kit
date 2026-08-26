import type {INestApplication} from '@nestjs/common'
import {VersioningType} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import request from 'supertest'
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {PermissionName} from '@b2b-saas-starter-kit/contracts'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'

import type {PostgresTestDatabase} from '@b2b-saas-starter-kit/composition/testing'
import {preparePostgresTestDatabase, seedActiveMembership} from '@b2b-saas-starter-kit/composition/testing'

import {AppModule} from '../src/app/app.module'

describe('HTTP e2e', () => {
  let app: INestApplication
  let database: PostgresTestDatabase

  beforeAll(async () => {
    database = await preparePostgresTestDatabase()
    LoggerLocator.init(new PinoLogger({level: 'error', isPretty: false}))
    app = await NestFactory.create(AppModule, {logger: false, abortOnError: false})
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
  })

  it('creates a user, tenant, and returns owner permissions on /v1/me', async () => {
    const createdUser = await request(app.getHttpServer())
      .post('/v1/users')
      .send({email: 'ada@example.com', displayName: 'Ada'})
      .expect(201)

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
        PermissionName.tenancyTenantRead,
        PermissionName.authorizationRolesRead,
        PermissionName.identityUsersRead,
      ]),
    )
    expect(me.body.effectivePermissions).toHaveLength(4)

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
})
