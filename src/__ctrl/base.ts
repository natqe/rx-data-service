import cloneDeep from 'lodash.clonedeep'
import { BehaviorSubject, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { waitUntilFalse } from '../__util/wait-until-false'

type dataServiceCtrlOptions = {
  autoLoad: boolean
  upsert: boolean
}

const defaults: dataServiceCtrlOptions = {
  autoLoad: true,
  upsert: true
}

export abstract class DataServiceCtrl<T> {

  load: Observable<T>
  clearWasActive: boolean
  autoLoad: boolean
  upsert: boolean
  abstract create: Observable<any>
  abstract edit: Observable<any>
  abstract delete: Observable<any>
  abstract removeOptions: BehaviorSubject<{ loadNext?: boolean }>

  constructor({ autoLoad = defaults.autoLoad, upsert = defaults.upsert } = defaults) {
    this.autoLoad = autoLoad
    this.upsert = upsert
  }

  readonly value = new BehaviorSubject<T>(null)

  readonly operating = new BehaviorSubject<boolean>(null)

  readonly loading = new BehaviorSubject<boolean>(null)

  readonly creating = new BehaviorSubject<boolean>(null)

  readonly editing = new BehaviorSubject<boolean>(null)

  readonly deleting = new BehaviorSubject<boolean>(null)

  readonly operatingSuccess = new BehaviorSubject<boolean>(null)

  readonly loadingSuccess = new BehaviorSubject<boolean>(null)

  readonly creatingSuccess = new BehaviorSubject<boolean>(null)

  readonly editingSuccess = new BehaviorSubject<boolean>(null)

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
    return cloneDeep(this.value.getValue())
  }

}