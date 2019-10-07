import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'
import reject from 'lodash.reject'
import get from 'lodash.get'

export class DeleteOptions {
  loadNext?: boolean
  deleteAll?: boolean
  constructor(value?: DeleteOptions) {
    merge(this, value)
  }
}

const defaultOptions = new DeleteOptions({
  loadNext: null,
  deleteAll: null
})

export function Delete({ loadNext = defaultOptions.loadNext, deleteAll = defaultOptions.deleteAll } = defaultOptions) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, deleting, deletingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1
      const
        deleteValue = result => {
          if (get(target.constructor[optionsKey], `type`, Object) === Array && result && !deleteAll) {
            let afterRemove = instanceCtrl.getValue() as Array<any>
            if (Array.isArray(result)) for (const conditions of result) afterRemove = reject(afterRemove, conditions)
            else afterRemove = reject(afterRemove, result)
            handleNext(value, afterRemove)
          }
          else if (deleteAll !== false || get(target.constructor[optionsKey], `type`, Object) !== Array) {
            instanceCtrl.clearWasActive = true
            handleNext(value, null)
          }
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          map(result => {
            if (++count < 2) {
              deleteValue(cloneDeep(result))
              deleting.next(false)
              deletingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
          }),
          catchError(response => {
            if (++count < 2) {
              deleting.next(false)
              deletingSuccess.next(false)
            }
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        deleting.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          --count
          deleting.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) deleteValue(returned)
      else { }
      return returned
    }
    descriptor.value[optionsKey] = new DeleteOptions({ loadNext, deleteAll })
    return descriptor
  }
}