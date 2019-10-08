import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, map, take } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { methods } from './__util/methods'
import { LoadOptions } from './load'

export class InsertOptions {
  refreshValue?: boolean
  constructor(value?: InsertOptions) {
    merge(this, value)
  }
}

const defaults = new InsertOptions({ refreshValue: null })

export function Insert({ refreshValue = defaults.refreshValue } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { inserting, insertingSuccess, value } = instanceCtrl,
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
        insertValue = result => {
          if (get(target.constructor[optionsKey], `type`, Object) === Array) {
            const items = ctrl<Array<any>>(this).getValue() || []
            handleNext(value, items.concat(result))
          }
          else handleNext(value, result)
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            if (++count < 2) {
              if (!refreshValue) insertValue(cloneDeep(result))
              inserting.next(false)
              insertingSuccess.next(true)
              if (refreshValue) refresh()
            }
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
      else if (returned !== undefined) {
        if (!refreshValue) insertValue(returned)
        else refresh()
      }
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new InsertOptions({ refreshValue })
    return descriptor
  }
}