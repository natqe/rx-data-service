import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, map, take, finalize } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { methods } from './__util/methods'
import { LoadOptions } from './load'
import mergeWith from 'lodash.mergewith'

export class UpdateOptions {
  id?: string | number
  refreshValue?: boolean
  emit?: boolean
  emitSuccess?: boolean
  deepMergeArrays?: boolean | string
  constructor(value?: UpdateOptions) {
    merge(this, value)
  }
}

const defaults = new UpdateOptions({
  refreshValue: null,
  emit: true,
  emitSuccess: true
})

export function Update({ id, refreshValue = defaults.refreshValue, emit = defaults.emit, emitSuccess = !emit ? false : defaults.emitSuccess, deepMergeArrays = defaults.deepMergeArrays } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { updating, updatingSuccess, value } = instanceCtrl,
        returned = original.apply(this, arguments),
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      if (!emit) updating = <any>{ next() { } }
      if (!emitSuccess) updatingSuccess = <any>{ next() { } }
      const
        updateValue = result => {
          if (get(target.constructor[optionsKey], `type`, Array) === Array) {
            if (id === null || id === undefined) id = get(target.constructor[optionsKey], `id`)
            const
              items = ctrl<Array<any>>(this).getValue() || [],
              updateOne = (item) => {
                const index = id ? items.findIndex(({ [id]: _id }) => _id === item[id]) : -1,
                pathesToMerge = index !== -1 && Array.isArray(deepMergeArrays) ? deepMergeArrays.map(path => get(items[index], path)) : []
                if (index !== -1) mergeWith(items[index], item, (a, b) => {
                  if (deepMergeArrays !== true && Array.isArray(a) && !pathesToMerge.some(item => item === a)) return b
                })
              }
            if (Array.isArray(result)) for (const item of result) updateOne(item)
            else updateOne(result)
            handleNext(value, items)
          }
          else if (instanceCtrl.value.value) handleNext(value, merge(instanceCtrl.getValue(), result))
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            if (!refreshValue) updateValue(cloneDeep(result))
            updatingSuccess.next(true)
            if (refreshValue) refresh()
          }),
          finalize(() => updating.next(false)),
          catchError(response => {
            updatingSuccess.next(false)
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        updating.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          updating.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) {
        if (!refreshValue) updateValue(returned)
        else refresh()
      }
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new UpdateOptions({ refreshValue, id, emit, emitSuccess, deepMergeArrays })
    return descriptor
  }
}