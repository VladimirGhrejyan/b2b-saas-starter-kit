import {useSelector} from 'react-redux'

import type {RootState} from '../redux/create-store.types'

export const useAppSelector = useSelector.withTypes<RootState>()
