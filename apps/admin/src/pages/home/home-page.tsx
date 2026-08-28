import {useTranslation} from 'react-i18next'

export function HomePage() {
  const {t} = useTranslation('common')

  return <h1>{t('appTitle')}</h1>
}
