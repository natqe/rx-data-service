import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { ctrl } from './__ctrl'

export function Operate() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { operating, operatingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 0
      const dial = () => <T>(src: Observable<T>) => src.pipe(
        tap(() => {
          if (++count === 1) {
            operating.next(false)
            operatingSuccess.next(true)
          }
        }),
        catchError(response => {
          if (++count === 1) {
            operating.next(false)
            operatingSuccess.next(false)
          }
          return throwError(response)
        })
      )
      if (returned && typeof returned.then === `function`) {
        operating.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const { subscribe } = returned
        returned.subscribe = function () {
          operating.next(true)
          return subscribe.apply(returned, arguments)
        }
        returned = returned.pipe(dial())
      }
      else { }
      return returned
    }
    return descriptor
  }
}