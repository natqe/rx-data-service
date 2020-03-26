import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, take, tap, finalize } from 'rxjs/operators'
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
  emit?: boolean
  emitSuccess?: boolean
  emitAs?: 'insert' | 'upsert' | 'update' | 'load'
  constructor(value?: DeleteOptions) {
    merge(this, value)
  }
}

const defaults = new DeleteOptions({
  loadNext: null,
  deleteAll: null,
  refreshValue: null,
  emit: true,
  emitSuccess: true,
  emitAs: null
})

export function Delete({ emitAs = defaults.emitAs, loadNext = defaults.loadNext, deleteAll = defaults.deleteAll, refreshValue = defaults.refreshValue, emit = defaults.emit, emitSuccess = !emit ? false : defaults.emitSuccess } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, deleting, deletingSuccess, upserting, upsertingSuccess, inserting, insertingSuccess, loading, loadingSuccess, updating, updatingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      if (emitAs) switch (emitAs) {
        case 'upsert': {
          deleting = upserting
          deletingSuccess = upsertingSuccess
          break
        }
        case 'insert': {
          deleting = inserting
          deletingSuccess = insertingSuccess
          break
        }
        case 'load': {
          deleting = loading
          deletingSuccess = loadingSuccess
          break
        }
        case 'update': {
          deleting = updating
          deletingSuccess = updatingSuccess
          break
        }
      }
      if (!emit) deleting = <any>{ next() { } }
      if (!emitSuccess) deletingSuccess = <any>{ next() { } }
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
            deletingSuccess.next(true)
            if (refreshValue) refresh()
          }),
          finalize(() => deleting.next(false)),
          catchError(response => {
            deletingSuccess.next(false)
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
    descriptor.value[optionsKey] = new DeleteOptions({ loadNext, deleteAll, refreshValue, emit, emitSuccess })
    return descriptor
  }
}