import merge from 'lodash.merge'
import { optionsKey } from './__key'
import { tap, take } from 'rxjs/operators'
import { protectValue } from './__util/protect-value'
import { waitUntilFalse } from './__util/wait-until-false'
import { ctrl } from './__ctrl'
import { methods } from './__util/methods'
import get from 'lodash.get'
import { LoadOptions } from './load'
import { DeleteOptions } from './delete'
import { Observable } from 'rxjs'

export abstract class AbstractDataService<T> {

  readonly value = ctrl<T>(this).value.pipe(
    tap(value => {
      const
        instanceMethods = methods(this),
        loadOnSubscribe: string = instanceMethods.find(key => {
          const options = get(this, [key, optionsKey]) as LoadOptions
          if(options instanceof LoadOptions) return options.loadOnSubscribe
        }),
        loadNext = instanceMethods.some(key => {
          const options = get(this, [key, optionsKey]) as DeleteOptions
          if(options instanceof DeleteOptions) return options.loadNext
        })
      if (value === null && loadOnSubscribe) if (!ctrl<T>(this).clearWasActive || loadNext) {
        const returned = this[loadOnSubscribe]()
        if(returned instanceof Observable) returned.pipe(take(1)).subscribe()
      }
    }),
    protectValue()
  )

  readonly operating = ctrl<T>(this).operating.asObservable()

  readonly loading = ctrl<T>(this).loading.pipe(
    ctrl<T>(this).dialOperating()
  )

  readonly upserting = ctrl<T>(this).upserting.pipe(
    ctrl<T>(this).dialOperating()
  )

  readonly deleting = ctrl<T>(this).deleting.pipe(
    ctrl<T>(this).dialOperating()
  )

  readonly operatingSuccess = ctrl<T>(this).operatingSuccess.pipe(
    waitUntilFalse(ctrl<T>(this).operating)
  )

  readonly loadingSuccess = ctrl<T>(this).loadingSuccess.pipe(
    ctrl<T>(this).waitAndDialOperatingSuccess(ctrl<T>(this).loading)
  )

  readonly upsertingSuccess = ctrl<T>(this).upsertingSuccess.pipe(
    ctrl<T>(this).waitAndDialOperatingSuccess(ctrl<T>(this).upserting)
  )

  readonly deletingSuccess = ctrl<T>(this).deletingSuccess.pipe(
    ctrl<T>(this).waitAndDialOperatingSuccess(ctrl<T>(this).deleting)
  )

}

export class DataServiceOptions {
  type?: typeof Array | typeof Object
  constructor(value?: DataServiceOptions) {
    merge(this, value)
  }
}

const defaultOptions = new DataServiceOptions({ type: Object })

export function DataService({ type = defaultOptions.type } = defaultOptions) {
  return function (target) {
    target[optionsKey] = new DataServiceOptions({ type })
    return target
  }
}