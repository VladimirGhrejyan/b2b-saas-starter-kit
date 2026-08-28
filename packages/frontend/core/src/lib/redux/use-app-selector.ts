import {useSelector} from 'react-redux'

import type {RootState} from './create-store.types'

export const useAppSelector = useSelector.withTypes<RootState>()
