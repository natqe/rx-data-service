import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, take, finalize } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import merge from 'lodash.merge'
import { methods } from './__util/methods'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { LoadOptions } from './load'

export class OperateOptions {
  refreshValue?: boolean
  emit?: boolean
  emitSuccess?: boolean
  constructor(value?: OperateOptions) {
    merge(this, value)
  }
}

const defaults = new OperateOptions({
  refreshValue: null,
  emit: true,
  emitSuccess: true
})

export function Operate({ refreshValue = defaults.refreshValue, emit = defaults.emit, emitSuccess = !emit ? false : defaults.emitSuccess } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { operating, operatingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      if (!emit) operating = <any>{ next() { } }
      if (!emitSuccess) operatingSuccess = <any>{ next() { } }
      const dial = () => <T>(src: Observable<T>) => src.pipe(
        tap(() => {
          operatingSuccess.next(true)
          if (refreshValue) refresh()
        }),
        finalize(() => operating.next(false)),
        catchError(response => {
          operatingSuccess.next(false)
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
    descriptor.value[optionsKey] = new OperateOptions({ refreshValue, emit, emitSuccess })
    return descriptor
  }
}