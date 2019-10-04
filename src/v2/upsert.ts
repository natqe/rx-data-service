import { Observable, from, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'

export class UpsertOptions {
  id: string | number
  constructor(value?: UpsertOptions) {
    merge(this, value)
  }
}

const defaultOptions = new UpsertOptions(<UpsertOptions>{})

export function Upsert({ id }: UpsertOptions) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { value, upserting, upsertingSuccess } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 0
      const
        upsertValue = result => {
          if (target.constructor[optionsKey].type === Array) {
            const
              items = ctrl<Array<any>>(this).getValue() || [],
              upsertOne = (item) => {
                const index = items.findIndex(({ [id]: _id }) => _id === item[id])
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
            if (++count === 1) {
              upsertValue(cloneDeep(result))
              upserting.next(false)
              upsertingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
          }),
          catchError(response => {
            if (++count === 1) {
              upserting.next(false)
              upsertingSuccess.next(false)
            }
            return throwError(response)
          })
        )
      if (returned instanceof Promise) {
        upserting.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (returned instanceof Observable) {
        upserting.next(true)
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