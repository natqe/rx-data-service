import { Observable, from, throwError, isObservable } from 'rxjs'
import { catchError, map, tap, finalize } from 'rxjs/operators'
import merge from 'lodash.merge'
import { ctrl } from './__ctrl'
import { handleNext } from './__util/handle-next'
import cloneDeep from 'lodash.clonedeep'
import { optionsKey } from './__key'

export class LoadOptions {
  loadOnSubscribe?: boolean
  emit?: boolean
  emitSuccess?: boolean
  constructor(value?: LoadOptions) {
    merge(this, value)
  }
}

const defaults = new LoadOptions({
  loadOnSubscribe: false,
  emit: true,
  emitSuccess: true
})

export function Load({ loadOnSubscribe = defaults.loadOnSubscribe, emit = defaults.emit, emitSuccess = !emit ? false : defaults.emitSuccess } = defaults) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function () {
      let
        { value, loading, loadingSuccess } = ctrl(this),
        returned = original.apply(this, arguments)
      if (!emit) loading = <any>{ next() { } }
      if (!emitSuccess) loadingSuccess = <any>{ next() { } }
      const
        setValue = result => handleNext(value, result),
        dial = () => <T>(src: Observable<T>) => src.pipe(
          tap(result => {
            setValue(cloneDeep(result))
            loadingSuccess.next(true)
          }),
          finalize(() => loading.next(false)),
          catchError(response => {
            loadingSuccess.next(false)
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
          return subscribe(...Array.from(arguments))
        }
        returned = returned.pipe(dial())
      }
      else if (returned !== undefined) setValue(returned)
      else { }
      return returned
    }
    descriptor.value[optionsKey] = new LoadOptions({ loadOnSubscribe, emit, emitSuccess })
    return descriptor
  }
}

export { Load as Set }