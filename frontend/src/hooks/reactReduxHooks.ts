/* 
Done such that we can mock state or dispatch in tests 
  The tested component must import these hooks instead of from react-redux
  and the test must import and spyOn them:
  https://gist.github.com/pylnata/43821fb253557254afcbee0288e97640
*/
import { ApplicationState } from '../store'
import { useSelector as originalUseSelector, useDispatch as originalUseDispatch } from 'react-redux'
export const useSelector = (fn: (state: ApplicationState) => any) => originalUseSelector(fn)
export const useDispatch = () => originalUseDispatch()
