import { Observable } from 'rxjs'
import { filter, mapTo, switchMap, take } from 'rxjs/operators'

export const waitUntilFalse = <T extends boolean>(srcToWhitFor: Observable<boolean>) => (src: Observable<T>) => src.pipe(
  switchMap(value => srcToWhitFor.pipe(
    filter(value => !value),
    take(1),
    mapTo(value)
  ))
)