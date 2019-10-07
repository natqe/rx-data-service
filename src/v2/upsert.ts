import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'
import get from 'lodash.get'

export class UpsertOptions {
  id?: string | number
  constructor(value?: UpsertOptions) {
    merge(this, value)
  }
}

export function Upsert({ id }: UpsertOptions) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, upserting, upsertingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1
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
          map(result => {
            if (++count < 2) {
              upsertValue(cloneDeep(result))
              upserting.next(false)
              upsertingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
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
      else if (returned !== undefined) upsertValue(returned)
      else { }
      return returned
    }
    descriptor.value[optionsKey] = new UpsertOptions({ id })
    return descriptor
  }
}