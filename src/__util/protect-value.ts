import cloneDeep from 'lodash.clonedeep'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export const protectValue = () => <T>(src: Observable<T>) => src.pipe(
  map(cloneDeep)
)