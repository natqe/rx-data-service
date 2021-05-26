import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map, take, tap, finalize } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'
import get from 'lodash.get'
import { methods } from './__util/methods'
import { LoadOptions } from './load'
import mergeWith from 'lodash.mergewith'

export class UpsertOptions {
  id?: string | number
  refreshValue?: boolean
  emit?: boolean
  emitSuccess?: boolean
  emitAs?: 'delete' | 'insert' | 'update' | 'load'
  deepMergeArrays?: boolean | Array<string>
  constructor(value?: UpsertOptions) {
    merge(this, value)
  }
}

const defaults = new UpsertOptions({
  refreshValue: null,
  emit: true,
  emitSuccess: true,
  emitAs: null
})

export function Upsert({ id,  emitAs = defaults.emitAs, refreshValue = defaults.refreshValue, emit = defaults.emit, emitSuccess = !emit ? false : defaults.emitSuccess, deepMergeArrays = defaults.deepMergeArrays } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, upserting, upsertingSuccess, deleting, deletingSuccess, inserting, insertingSuccess, updating, updatingSuccess, loading, loadingSuccess} = instanceCtrl,
        returned = original.apply(this, arguments),
        refresh = () => {
          const method = methods(this).find(key => get(this, [key, optionsKey]) instanceof LoadOptions)
          if (method !== null && method !== undefined) {
            const returned = this[method]()
            if (isObservable(returned)) returned.pipe(take(1)).subscribe()
          }
        }
      if (emitAs) switch (emitAs) {
        case 'delete': {
          upserting = deleting
          upsertingSuccess = deletingSuccess
          break
        }
        case 'insert': {
          upserting = inserting
          upsertingSuccess = insertingSuccess
          break
        }
        case 'load': {
          upserting = loading
          upsertingSuccess = loadingSuccess
          break
        }
        case 'update': {
          upserting = updating
          upsertingSuccess = updatingSuccess
          break
        }
      }
      if (!emit) upserting = <any>{ next() { } }
      if (!emitSuccess) upsertingSuccess = <any>{ next() { } }
      const
        upsertValue = result => {
          if (get(target.constructor[optionsKey], `type`, Array) === Array) {
            if (id === null || id === undefined) id = get(target.constructor[optionsKey], `id`)
            const
              items = ctrl<Array<any>>(this).getValue() || [],
              upsertOne = (item) => {
                if (item) {
                  const
                    index = id ? items.findIndex(({ [id]: _id }) => _id === item[id]) : -1,
                    pathesToMerge = index !== -1 && Array.isArray(deepMergeArrays) ? deepMergeArrays.map(path => get(items[index], path)) : []
                  index !== -1 ?
                    mergeWith(items[index], item, (a, b) => {
                      if (deepMergeArrays !== true && Array.isArray(a) && !pathesToMerge.some(item => item === a)) return b
                    }) :
                    items.push(item)
                }
              }
            if (Array.isArray(result)) for (const item of result) upsertOne(item)
            else upsertOne(result)
            handleNext(value, items)
          }
          else handleNext(instanceCtrl.value, instanceCtrl.value.value ? merge(instanceCtrl.getValue(), result) : result)
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            if (!refreshValue) upsertValue(cloneDeep(result))
            upsertingSuccess.next(true)
            if (refreshValue) refresh()
          }),
          finalize(() => upserting.next(false)),
          catchError(response => {
            upsertingSuccess.next(false)
            return throwError(()=> {
              const err = new Error(response.message)
              err.stack = response.stack
              return err
            })
          })
        )
      if (returned && typeof returned.then === `function`) {
        upserting.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          upserting.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) {
        if (!refreshValue) upsertValue(returned)
        else refresh()
      }
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new UpsertOptions({ id, refreshValue, emit, emitSuccess, deepMergeArrays })
    return descriptor
  }
}