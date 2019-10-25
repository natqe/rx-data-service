import cloneDeep from 'lodash.clonedeep'
import { BehaviorSubject, Observable } from 'rxjs'
import { tap, skip } from 'rxjs/operators'
import { AbstractDataService } from './service'
import isEqual from 'lodash.isequal'
import { deepFreeze } from './__util/deep-freeze'

class Ctrl<T> {

  clearWasActive: boolean

  private prevSnapshot: {
    value: T,
    operating: boolean,
    loading: boolean,
    setting: boolean,
    upserting: boolean,
    inserting: boolean,
    creating: boolean,
    updating: boolean,
    deleting: boolean,
    operatingSuccess: boolean,
    loadingSuccess: boolean,
    settingSuccess: boolean,
    upsertingSuccess: boolean,
    insertingSuccess: boolean,
    creatingSuccess: boolean,
    updatingSuccess: boolean,
    deletingSuccess: boolean
  }

  constructor() {
    this.dialOperating()
  }

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

  private dialOperating() {
    const { operating, operatingSuccess, deleting, deletingSuccess, updating, updatingSuccess, upserting, inserting, insertingSuccess, loading, loadingSuccess, upsertingSuccess } = this
    for (const observable of [deleting, updating, upserting, inserting, loading]) observable.
      pipe(
        skip(1),
        tap<boolean>(value => operating.next(value))
      ).
      subscribe()
    for (const observable of [deletingSuccess, updatingSuccess, insertingSuccess, loadingSuccess, upsertingSuccess]) observable.
      pipe(
        skip(1),
        tap<boolean>(value => operatingSuccess.next(value))
      ).
      subscribe()
  }

  getValue() {
    return cloneDeep(this.value.value)
  }

  get snapshot(): Ctrl<T>['prevSnapshot'] {
    const
      { operating, loading, upserting, inserting, updating, deleting, operatingSuccess, loadingSuccess, upsertingSuccess, insertingSuccess, updatingSuccess, deletingSuccess, prevSnapshot } = this,
      snapshot: Ctrl<T>['prevSnapshot'] = {
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