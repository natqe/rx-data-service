import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'

export class LoadOptions {
  loadOnSubscribe?: boolean
  constructor(value?: LoadOptions) {
    merge(this, value)
  }
}

const defaultOptions = new LoadOptions({ loadOnSubscribe: false })

export function Load({ loadOnSubscribe = defaultOptions.loadOnSubscribe } = defaultOptions) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        { value, loading, loadingSuccess } = ctrl(this),
        returned = original.apply(this, arguments),
        count = 0
      const
        setValue = result => handleNext(value, result),
        dial = () => <T>(src: Observable<T>) => src.pipe(
          map(result => {
            if (++count === 1) {
              setValue(cloneDeep(result))
              loading.next(false)
              loadingSuccess.next(true)
              return cloneDeep(result)
            }
            else return result
          }),
          catchError(response => {
            if (++count === 1) {
              loading.next(false)
              loadingSuccess.next(false)
            }
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        loading.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          loading.next(true)
          return subscribe(arguments)
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) setValue(returned)
      else { }
      return returned
    }
    descriptor.value[optionsKey] = new LoadOptions({ loadOnSubscribe })
    return descriptor
  }
}