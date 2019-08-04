import random from 'lodash.random'
import { Observable, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { Ctrl } from './__ctrl/base'
import { handleNext } from './__util/handle-next'
import { protectValue } from './__util/protect-value'
import { switchOnce } from './__util/switch-once'
import { waitUntilFalse } from './__util/wait-until-false'

export const instances: { [key: number]: Ctrl<any> } = {}

const getCtrl = <T>(id: number) => <Ctrl<T>>instances[id]

export abstract class BaseDataService<T> {

  protected abstract get create(): Observable<any>
  protected abstract set create(executer: Observable<any>)
  protected abstract get edit(): Observable<any>
  protected abstract set edit(executer: Observable<any>)
  protected abstract get delete(): Observable<any>
  protected abstract set delete(executer: Observable<any>)
  protected abstract patch(item: any): void

  protected readonly __dataServiceInstanceId = random(Number.MAX_SAFE_INTEGER)

  readonly value = instances[this.__dataServiceInstanceId].value.pipe(
    tap(value => {
      const { load, removeOptions: clearValueOptions, clearWasActive, autoLoad } = getCtrl<T>(this.__dataServiceInstanceId)
      if (value === null && load && autoLoad) if (!clearWasActive || clearValueOptions.getValue().loadNext) load.subscribe()
    }),
    protectValue()
  )

  readonly operating = getCtrl<T>(this.__dataServiceInstanceId).operating.asObservable()

  readonly loading = getCtrl<T>(this.__dataServiceInstanceId).loading.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).dialOperating()
  )

  readonly creating = getCtrl<T>(this.__dataServiceInstanceId).creating.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).dialOperating()
  )

  readonly editing = getCtrl<T>(this.__dataServiceInstanceId).editing.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).dialOperating()
  )

  readonly deleting = getCtrl<T>(this.__dataServiceInstanceId).deleting.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).dialOperating()
  )

  readonly operatingSuccess = getCtrl<T>(this.__dataServiceInstanceId).operatingSuccess.pipe(
    waitUntilFalse(getCtrl<T>(this.__dataServiceInstanceId).operating)
  )

  readonly loadingSuccess = getCtrl<T>(this.__dataServiceInstanceId).loadingSuccess.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).waitAndDialOperatingSuccess(getCtrl<T>(this.__dataServiceInstanceId).loading)
  )

  readonly creatingSuccess = getCtrl<T>(this.__dataServiceInstanceId).creatingSuccess.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).waitAndDialOperatingSuccess(getCtrl<T>(this.__dataServiceInstanceId).creating)
  )

  readonly editingSuccess = getCtrl<T>(this.__dataServiceInstanceId).editingSuccess.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).waitAndDialOperatingSuccess(getCtrl<T>(this.__dataServiceInstanceId).editing)
  )

  readonly deletingSuccess = getCtrl<T>(this.__dataServiceInstanceId).deletingSuccess.pipe(
    getCtrl<T>(this.__dataServiceInstanceId).waitAndDialOperatingSuccess(getCtrl<T>(this.__dataServiceInstanceId).deleting)
  )

  protected set load(executer: Ctrl<T>['load']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
      { loading, loadingSuccess } = ctrl,
      dialLoading = <T>(value: boolean) => tap<T>(() => loading.next(value))
    if (executer instanceof Observable) ctrl.load = of(null).pipe(
      dialLoading(true),
      switchOnce(executer),
      tap(value => {
        this.set(value)
        loadingSuccess.next(true)
      }),
      catchError(response => {
        loadingSuccess.next(false)
        return this.handleLoadingError(response)
      }),
      dialLoading(false),
      protectValue()
    )
  }

  protected get load() {
    return getCtrl<T>(this.__dataServiceInstanceId).load
  }

  protected set(value: T) {
    handleNext(getCtrl<T>(this.__dataServiceInstanceId).value, value)
  }

  protected clear({ loadNext = getCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue().loadNext } = getCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue()) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
    { removeOptions, value } = ctrl
    handleNext(removeOptions, { ...removeOptions.getValue(), loadNext })
    handleNext(value, null)
    ctrl.clearWasActive = true
  }

  protected handleError(response) {
    console.error(response)
    return of(response)
  }

  protected handleOperatingError(response) {
    return this.handleError(response)
  }

  protected handleLoadingError(response) {
    return this.handleError(response)
  }

  protected handleCreatingError(response) {
    return this.handleError(response)
  }

  protected handleEditingError(response) {
    return this.handleError(response)
  }

  protected handleDeletingError(response) {
    return this.handleError(response)
  }

  protected wrapAsync<P>(executer: Observable<P>): Observable<P> {
    const
      { operating, operatingSuccess } = getCtrl<T>(this.__dataServiceInstanceId),
      dialOperating = <T>(value: boolean) => tap<T>(() => operating.next(value))
    if (executer instanceof Observable) return of(null).pipe(
      dialOperating(true),
      switchOnce(executer),
      tap(() => operatingSuccess.next(true)),
      catchError(response => {
        operatingSuccess.next(false)
        return this.handleOperatingError(response)
      }),
      dialOperating(false)
    )
  }

}