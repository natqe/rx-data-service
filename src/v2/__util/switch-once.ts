import { Observable } from 'rxjs'
import { switchMapTo, take } from 'rxjs/operators'

export const switchOnce = <E>(executer: Observable<E>) => <T>(src: Observable<T>) => src.pipe(
  switchMapTo(executer),
  take(1)
)