import {useDispatch} from 'react-redux'

import type {AppDispatch} from './create-store.types'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
