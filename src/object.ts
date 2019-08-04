import merge from 'lodash.merge'
import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { BaseDataService } from './__base'
import { OCtrl } from './__ctrl/object'
import { handleNext } from './__util/handle-next'
import { switchOnce } from './__util/switch-once'

export type dataServiceOptions = {
  autoLoad?: boolean
  upsert?: boolean
}

const defaults: dataServiceOptions = {
  autoLoad: true,
  upsert: true
}

export abstract class ObjectDataService<T> extends BaseDataService<T> {

  protected readonly __dataServiceInstanceCtrl: OCtrl<T>

  constructor({ autoLoad = defaults.autoLoad, upsert = defaults.upsert } = defaults) {
    super(new OCtrl({ autoLoad, upsert }))
  }

  protected set create(executer: OCtrl<T>['create']) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
      { creating, creatingSuccess } = ctrl,
      dialCreating = <T>(value: boolean) => tap<T>(() => creating.next(value))
    if (executer instanceof Observable) ctrl.create = of(null).pipe(
      dialCreating(true),
      switchOnce(executer),
      tap(value => {
        this.set(value)
        creatingSuccess.next(true)
      }),
      catchError(response => {
        creatingSuccess.next(false)
        return this.handleCreatingError(response)
      }),
      dialCreating(false),
      this.protectValue()
    )
  }

  protected set edit(executer: OCtrl<T>['edit']) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
      { editing, editingSuccess } = ctrl,
      dialEditing = <T>(value: boolean) => tap<T>(() => editing.next(value))
    if (executer instanceof Observable) ctrl.edit = of(null).pipe(
      dialEditing(true),
      switchOnce(executer),
      tap(value => {
        this.patch(value)
        editingSuccess.next(true)
      }),
      catchError(response => {
        editingSuccess.next(false)
        return this.handleEditingError(response)
      }),
      dialEditing(false),
      this.protectValue()
    )
  }

  protected set delete(executer: OCtrl<T>['delete']) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
      { deleting, deletingSuccess } = ctrl,
      dialDeleting = <T>(value: boolean) => tap<T>(() => deleting.next(value))
    if (executer instanceof Observable) ctrl.delete = of(null).pipe(
      dialDeleting(true),
      switchOnce(executer),
      tap(() => {
        this.clear({ loadNext: false })
        deletingSuccess.next(true)
      }),
      catchError(response => {
        deletingSuccess.next(false)
        return this.handleDeletingError(response)
      }),
      dialDeleting(false),
      this.protectValue()
    )
  }

  protected get create() {
    return this.__dataServiceInstanceCtrl.create
  }

  protected get edit() {
    return this.__dataServiceInstanceCtrl.edit
  }

  protected get delete() {
    return this.__dataServiceInstanceCtrl.delete
  }

  protected patch(newValue: Partial<T>) {
    const
      ctrl = this.__dataServiceInstanceCtrl,
      value = ctrl.getValue()
    if (ctrl.upsert || value) handleNext(ctrl.value, merge(ctrl.getValue(), newValue))
  }

}

export { ObjectDataService as DataService }

export default ObjectDataService