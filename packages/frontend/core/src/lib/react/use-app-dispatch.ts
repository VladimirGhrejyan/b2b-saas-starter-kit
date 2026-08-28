import {useDispatch} from 'react-redux'

import type {AppDispatch} from '../redux/create-store.types'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
