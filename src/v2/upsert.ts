import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map, take, tap } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'
import get from 'lodash.get'
import { methods } from './__util/methods'
import { LoadOptions } from './load'

export class UpsertOptions {
  id?: string | number
  refreshValue?: boolean
  constructor(value?: UpsertOptions) {
    merge(this, value)
  }
}

const defaults = new UpsertOptions({ refreshValue: null })

export function Upsert({ id, refreshValue = defaults.refreshValue } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, upserting, upsertingSuccess } = instanceCtrl,
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
        upsertValue = result => {
          if (get(target.constructor[optionsKey], `type`, Object) === Array) {
            const
              items = ctrl<Array<any>>(this).getValue() || [],
              upsertOne = (item) => {
                const index = id ? items.findIndex(({ [id]: _id }) => _id === item[id]) : -1
                index !== -1 ? merge(items[index], item) : items.push(item)
              }
            if (Array.isArray(result)) for (const item of result) upsertOne(item)
            else upsertOne(result)
            handleNext(value, items)
          }
          else handleNext(instanceCtrl.value, instanceCtrl.value.value ? merge(instanceCtrl.getValue(), result) : result)
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            if (++count < 2) {
              if (!refreshValue)   upsertValue(cloneDeep(result))
              upserting.next(false)
              upsertingSuccess.next(true)
              if (refreshValue) refresh()
            }
          }),
          catchError(response => {
            if (++count < 2) {
              upserting.next(false)
              upsertingSuccess.next(false)
            }
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        upserting.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          --count
          upserting.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) {
        if (!refreshValue)   upsertValue(returned)
        else refresh()
      }
      else {
        if (refreshValue) refresh()
      }
      return returned
    }
    descriptor.value[optionsKey] = new UpsertOptions({ id, refreshValue })
    return descriptor
  }
}