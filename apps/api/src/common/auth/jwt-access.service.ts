import {randomUUID} from 'node:crypto'

import {Inject, Injectable, UnauthorizedException} from '@nestjs/common'
import {jwtVerify, SignJWT} from 'jose'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {JwtAccessClaims, JwtAccessConfig} from './jwt-access.types'
import {JWT_ACCESS_CONFIG} from './jwt-access-config.token'

@Injectable()
export class JwtAccessService {
  private readonly secret: Uint8Array

  constructor(@Inject(JWT_ACCESS_CONFIG) private readonly config: JwtAccessConfig) {
    this.secret = new TextEncoder().encode(config.secret)
  }

  get expiresIn(): number {
    return this.config.ttlSeconds
  }

  get nodeEnv(): JwtAccessConfig['nodeEnv'] {
    return this.config.nodeEnv
  }

  async sign(claims: {userId: UserId; tenantId?: TenantId}): Promise<string> {
    const token = new SignJWT(claims.tenantId === undefined ? {} : {tid: claims.tenantId})
      .setProtectedHeader({alg: 'HS256'})
      .setSubject(claims.userId)
      .setIssuedAt()
      .setExpirationTime(`${String(this.config.ttlSeconds)}s`)
      .setJti(randomUUID())
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)

    return token.sign(this.secret)
  }

  async verify(token: string): Promise<JwtAccessClaims> {
    try {
      const {payload} = await jwtVerify(token, this.secret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      })

      if (payload.sub === undefined) {
        throw new UnauthorizedException('access token is invalid')
      }

      const userId = UserId.parse(payload.sub)
      const tid = payload.tid

      if (tid === undefined) {
        return {userId}
      }

      if (typeof tid !== 'string') {
        throw new UnauthorizedException('access token is invalid')
      }

      return {userId, tenantId: TenantId.parse(tid)}
    } catch {
      throw new UnauthorizedException('access token is invalid')
    }
  }
}
