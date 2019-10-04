import { Observable } from 'rxjs'
import cloneDeep from 'lodash.clonedeep'
import { map } from 'rxjs/operators'

export const protectValue = () => {
  return <T>(src: Observable<T>) => src.pipe(
    map(cloneDeep)
  )
}