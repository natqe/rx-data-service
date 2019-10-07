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
        count = 1
      const dial = () => <T>(src: Observable<T>) => src.pipe(
        tap(() => {
          if (++count < 2) {
            operating.next(false)
            operatingSuccess.next(true)
          }
        }),
        catchError(response => {
          if (++count < 2) {
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
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          --count
          operating.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else { }
      return returned
    }
    return descriptor
  }
}