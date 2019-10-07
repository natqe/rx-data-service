import cloneDeep from 'lodash.clonedeep'
import { BehaviorSubject, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { waitUntilFalse } from './__util/wait-until-false'
import { AbstractDataService } from './service'

class Ctrl<T> {

  clearWasActive: boolean

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

}

const store = new Map<AbstractDataService<any>, Ctrl<any>>()

export const ctrl = <T>(dataService: AbstractDataService<T>): Ctrl<T> => {
  return store.has(dataService) ? store.get(dataService) : store.set(dataService, new Ctrl).get(dataService)
}