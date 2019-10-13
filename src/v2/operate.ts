import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, take } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import merge from 'lodash.merge'
import { methods } from './__util/methods'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { LoadOptions } from './load'

export class OperateOptions {
  refreshValue?: boolean
  constructor(value?: OperateOptions) {
    merge(this, value)
  }
}

const defaults = new OperateOptions({ refreshValue: null })

export function Operate({ refreshValue = defaults.refreshValue } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { operating, operatingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1,
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      const dial = () => <T>(src: Observable<T>) => src.pipe(
        tap(() => {
          if (++count < 2) operating.next(false)
          operatingSuccess.next(true)
          if (refreshValue) refresh()
        }),
        catchError(response => {
          if (++count < 2) operating.next(false)
          operatingSuccess.next(false)
          return throwError(response)
        })
      )
      if (returned && typeof returned.then === `function`) {
        --count
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
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new OperateOptions({ refreshValue })
    return descriptor
  }
}