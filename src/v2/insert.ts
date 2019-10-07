import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, map } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'

export function Insert() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { inserting, insertingSuccess, value } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1
      const
        insertValue = result => {
          if (get(target.constructor[optionsKey], `type`, Object) === Array) {
            const items = ctrl<Array<any>>(this).getValue() || []
            handleNext(value, items.concat(result))
          }
          else handleNext(value, result)
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          map(result => {
            if (++count < 2) {
              insertValue(cloneDeep(result))
              inserting.next(false)
              insertingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
          }),
          catchError(response => {
            if (++count < 2) {
              inserting.next(false)
              insertingSuccess.next(false)
            }
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        inserting.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          --count
          inserting.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) insertValue(returned)
      else { }
      return returned
    }
    return descriptor
  }
}