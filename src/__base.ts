import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { Ctrl } from './__ctrl/base'
import { handleNext } from './__util/handle-next'
import { protectValue } from './__util/protect-value'
import { switchOnce } from './__util/switch-once'
import { waitUntilFalse } from './__util/wait-until-false'

export abstract class BaseDataService<T> {

  protected abstract get create(): Observable<any>
  protected abstract set create(executer: Observable<any>)
  protected abstract get edit(): Observable<any>
  protected abstract set edit(executer: Observable<any>)
  protected abstract get delete(): Observable<any>
  protected abstract set delete(executer: Observable<any>)
  protected abstract patch(item: any): void

  constructor(protected readonly __dataServiceInstanceCtrl: Ctrl<T>) { }

  readonly value = this.__dataServiceInstanceCtrl.value.pipe(
    tap(value => {
      const { load, removeOptions: clearValueOptions, clearWasActive, autoLoad } = this.__dataServiceInstanceCtrl
      if (value === null && load && autoLoad) if (!clearWasActive || clearValueOptions.getValue().loadNext) load.subscribe()
    }),
    protectValue()
  )

  readonly operating = this.__dataServiceInstanceCtrl.operating.asObservable()

  readonly loading = this.__dataServiceInstanceCtrl.loading.pipe(
    this.__dataServiceInstanceCtrl.dialOperating()
  )

  readonly creating = this.__dataServiceInstanceCtrl.creating.pipe(
    this.__dataServiceInstanceCtrl.dialOperating()
  )

  readonly editing = this.__dataServiceInstanceCtrl.editing.pipe(
    this.__dataServiceInstanceCtrl.dialOperating()
  )

  readonly deleting = this.__dataServiceInstanceCtrl.deleting.pipe(
    this.__dataServiceInstanceCtrl.dialOperating()
  )

  readonly operatingSuccess = this.__dataServiceInstanceCtrl.operatingSuccess.pipe(
    waitUntilFalse(this.__dataServiceInstanceCtrl.operating)
  )

  readonly loadingSuccess = this.__dataServiceInstanceCtrl.loadingSuccess.pipe(
    this.__dataServiceInstanceCtrl.waitAndDialOperatingSuccess(this.__dataServiceInstanceCtrl.loading)
  )

  readonly creatingSuccess = this.__dataServiceInstanceCtrl.creatingSuccess.pipe(
    this.__dataServiceInstanceCtrl.waitAndDialOperatingSuccess(this.__dataServiceInstanceCtrl.creating)
  )

  readonly editingSuccess = this.__dataServiceInstanceCtrl.editingSuccess.pipe(
    this.__dataServiceInstanceCtrl.waitAndDialOperatingSuccess(this.__dataServiceInstanceCtrl.editing)
  )

  readonly deletingSuccess = this.__dataServiceInstanceCtrl.deletingSuccess.pipe(
    this.__dataServiceInstanceCtrl.waitAndDialOperatingSuccess(this.__dataServiceInstanceCtrl.deleting)
  )

  protected set load(executer: Ctrl<T>['load']) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
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
    return this.__dataServiceInstanceCtrl.load
  }

  protected set(value: T) {
    handleNext(this.__dataServiceInstanceCtrl.value, value)
  }

  protected clear({ loadNext = this.__dataServiceInstanceCtrl.removeOptions.getValue().loadNext } = this.__dataServiceInstanceCtrl.removeOptions.getValue()) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
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
      { operating, operatingSuccess } = this.__dataServiceInstanceCtrl,
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