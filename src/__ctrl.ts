import cloneDeep from 'lodash.clonedeep'
import { BehaviorSubject, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { waitUntilFalse } from './__util/wait-until-false'
import { AbstractDataService } from './service'
import isEqual from 'lodash.isequal'
import { deepFreeze } from './__util/deep-freeze'

class Ctrl<T> {

  clearWasActive: boolean

  private prevSnapshot: this['snapshot']

  readonly value = new BehaviorSubject<T>(null)

  readonly operating = new BehaviorSubject<boolean>(null)

  readonly loading = new BehaviorSubject<boolean>(null)

  readonly upserting = new BehaviorSubject<boolean>(null)

  readonly inserting = new BehaviorSubject<boolean>(null)

  readonly updating = new BehaviorSubject<boolean>(null)

  readonly deleting = new BehaviorSubject<boolean>(null)

  readonly operatingSuccess = new BehaviorSubject<boolean>(null)

  readonly loadingSuccess = new BehaviorSubject<boolean>(null)

  readonly upsertingSuccess = new BehaviorSubject<boolean>(null)

  readonly insertingSuccess = new BehaviorSubject<boolean>(null)

  readonly updatingSuccess = new BehaviorSubject<boolean>(null)

  readonly deletingSuccess = new BehaviorSubject<boolean>(null)

  dialOperating<T extends boolean>() {
    return tap<T>(value => this.operating.next(value))
  }

  waitAndDialOperatingSuccess<T extends boolean>(srcToWhitFor: Observable<boolean>) {
    return (src: Observable<T>) => src.pipe(
      waitUntilFalse(srcToWhitFor),
      tap<T>(value => this.operatingSuccess.next(value))
    )
  }

  getValue() {
    return cloneDeep(this.value.value)
  }

  get snapshot() {
    const
      { operating, loading, upserting, inserting, updating, deleting, operatingSuccess, loadingSuccess, upsertingSuccess, insertingSuccess, updatingSuccess, deletingSuccess, prevSnapshot } = this,
      snapshot = {
        value: this.getValue(),
        operating: operating.value,
        loading: loading.value,
        setting: loading.value,
        upserting: upserting.value,
        inserting: inserting.value,
        creating: inserting.value,
        updating: updating.value,
        deleting: deleting.value,
        operatingSuccess: operatingSuccess.value,
        loadingSuccess: loadingSuccess.value,
        settingSuccess: loadingSuccess.value,
        upsertingSuccess: upsertingSuccess.value,
        insertingSuccess: insertingSuccess.value,
        creatingSuccess: insertingSuccess.value,
        updatingSuccess: updatingSuccess.value,
        deletingSuccess: deletingSuccess.value
      }
    return isEqual(prevSnapshot, snapshot) ? prevSnapshot as typeof snapshot : this.prevSnapshot = deepFreeze(snapshot)
  }

}

const store = new Map<AbstractDataService<any>, Ctrl<any>>()

export const ctrl = <T>(dataService: AbstractDataService<T>): Ctrl<T> => {
  return store.has(dataService) ? store.get(dataService) : store.set(dataService, new Ctrl).get(dataService)
}