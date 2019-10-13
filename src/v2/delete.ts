import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map, take, tap } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'
import reject from 'lodash.reject'
import get from 'lodash.get'
import { methods } from './__util/methods'
import { LoadOptions } from './load'

export class DeleteOptions {
  loadNext?: boolean
  deleteAll?: boolean
  refreshValue?: boolean
  constructor(value?: DeleteOptions) {
    merge(this, value)
  }
}

const defaults = new DeleteOptions({
  loadNext: null,
  deleteAll: null,
  refreshValue: null
})

export function Delete({ loadNext = defaults.loadNext, deleteAll = defaults.deleteAll, refreshValue = defaults.refreshValue } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, deleting, deletingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1,
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      const
        deleteValue = result => {
          if (get(target.constructor[optionsKey], `type`, Array) === Array && result && !deleteAll) {
            let afterRemove = instanceCtrl.getValue() as Array<any>
            if (Array.isArray(result)) for (const conditions of result) afterRemove = reject(afterRemove, conditions)
            else afterRemove = reject(afterRemove, result)
            handleNext(value, afterRemove)
          }
          else if (deleteAll !== false || get(target.constructor[optionsKey], `type`, Array) !== Array) {
            instanceCtrl.clearWasActive = true
            handleNext(value, null)
          }
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            if (!refreshValue) deleteValue(cloneDeep(result))
            if (++count < 2) deleting.next(false)
            deletingSuccess.next(true)
            if (refreshValue) refresh()
          }),
          catchError(response => {
            if (++count < 2) deleting.next(false)
            deletingSuccess.next(false)
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        --count
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
      else if (returned !== undefined) {
        if (!refreshValue) deleteValue(returned)
        else refresh()
      }
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new DeleteOptions({ loadNext, deleteAll })
    return descriptor
  }
}