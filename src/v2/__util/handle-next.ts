import { BehaviorSubject } from 'rxjs'
import isEqual from 'lodash.isequal'

export const  handleNext = (observable: BehaviorSubject<any>, value) => {
  if (!isEqual(value, observable.value)) observable.next(value)
}