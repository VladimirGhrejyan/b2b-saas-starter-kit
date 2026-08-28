import {useTranslation} from 'react-i18next'
import {Link} from 'react-router'

import {paths} from '@/shared/router'

export function AppNav() {
  const {t} = useTranslation('common')

  return (
    <nav>
      <Link to={paths.home}>{t('navHome')}</Link>
    </nav>
  )
}
