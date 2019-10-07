import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, tap, map } from 'rxjs/operators'
import { ctrl } from './__ctrl'
import get from 'lodash.get'
import { optionsKey } from './__key'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'

export class UpdateOptions {
  id?: string | number
  constructor(value?: UpdateOptions) {
    merge(this, value)
  }
}

export function Update({ id }: UpdateOptions) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        instanceCtrl = ctrl(this),
        { updating, updatingSuccess, value } = instanceCtrl,
        returned = original.apply(this, arguments),
        count = 1
      const
        updateValue = result => {
          if (get(target.constructor[optionsKey], `type`, Object) === Array) {
            const
              items = ctrl<Array<any>>(this).getValue() || [],
              updateOne = (item) => {
                const index = id ? items.findIndex(({ [id]: _id }) => _id === item[id]) : -1
                if (index !== -1) merge(items[index], item)
              }
            if (Array.isArray(result)) for (const item of result) updateOne(item)
            else updateOne(result)
            handleNext(value, items)
          }
          else if (instanceCtrl.value.value) handleNext(value, merge(instanceCtrl.getValue(), result))
        },
        dial = () => <T>(src: Observable<T>) => src.pipe(
          map(result => {
            if (++count < 2) {
              updateValue(cloneDeep(result))
              updating.next(false)
              updatingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
          }),
          catchError(response => {
            if (++count < 2) {
              updating.next(false)
              updatingSuccess.next(false)
            }
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
          --count
          updating.next(true)
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) updateValue(returned)
      else { }
      return returned
    }
    return descriptor
  }
}