import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
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
        count = 1
      const
        setValue = result => handleNext(value, result),
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            setValue(cloneDeep(result))
            if (++count < 2) loading.next(false)
            loadingSuccess.next(true)
          }),
          catchError(response => {
            if (++count < 2) loading.next(false)
            loadingSuccess.next(false)
            return throwError(response)
          })
        )
      if (returned && typeof returned.then === `function`) {
        --count
        loading.next(true)
        from(returned).pipe(dial()).subscribe()
      }
      else if (isObservable(returned)) {
        const subscribe = returned.subscribe.bind(returned)
        returned.subscribe = function () {
          --count
          loading.next(true)
          return subscribe(...Array.from(arguments))
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

export { Load as Set }