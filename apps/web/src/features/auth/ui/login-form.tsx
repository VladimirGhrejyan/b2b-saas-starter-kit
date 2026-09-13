import {useState} from 'react'

import {useTranslation} from 'react-i18next'

import {loginInputSchema} from '@b2b-saas-starter-kit/contracts'
import {Button} from '@b2b-saas-starter-kit/ui-kit'

import {isErrorOutput} from '@/shared/api/is-error-output'

import {useLoginMutation} from '../api/auth-api'

export function LoginForm() {
  const {t} = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [login, {error, isLoading}] = useLoginMutation()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        const parsed = loginInputSchema.safeParse({email, password})

        if (!parsed.success) {
          return
        }

        void login(parsed.data)
      }}
    >
      <label htmlFor="login-email">{t('email')}</label>
      <input
        id="login-email"
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
        }}
      />
      <label htmlFor="login-password">{t('password')}</label>
      <input
        id="login-password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)
        }}
      />
      <Button type="submit" disabled={isLoading}>
        {t('submit')}
      </Button>
      {isErrorOutput(error) ? (
        <p>
          {error.code}: {error.message}
        </p>
      ) : null}
    </form>
  )
}
