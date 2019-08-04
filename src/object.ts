import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { BaseDataService, instances } from './__base'
import { ObjectDataServiceCtrl } from './__ctrl/object'
import { handleNext } from './__util/handle-next'
import { protectValue } from './__util/protect-value'
import { switchOnce } from './__util/switch-once'

export type dataServiceOptions = {
  autoLoad?: boolean
  upsert?: boolean
}

const defaults: dataServiceOptions = {
  autoLoad: true,
  upsert: true
}

const getCtrl = <T>(id: number) => <ObjectDataServiceCtrl<T>>instances[id]

export abstract class ObjectDataService<T> extends BaseDataService<T> {

  constructor({ autoLoad = defaults.autoLoad, upsert = defaults.upsert } = defaults) {
    super()
    instances[this.__dataServiceInstanceId] = new ObjectDataServiceCtrl({ autoLoad, upsert })
  }

  protected set create(executer: ObjectDataServiceCtrl<T>['create']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
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
      protectValue()
    )
  }

  protected set edit(executer: ObjectDataServiceCtrl<T>['edit']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
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
      protectValue()
    )
  }

  protected set delete(executer: ObjectDataServiceCtrl<T>['delete']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
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
      protectValue()
    )
  }

  protected get create() {
    return getCtrl<T>(this.__dataServiceInstanceId).create
  }

  protected get edit() {
    return getCtrl<T>(this.__dataServiceInstanceId).edit
  }

  protected get delete() {
    return getCtrl<T>(this.__dataServiceInstanceId).delete
  }

  protected patch(newValue: Partial<T>) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
      value = ctrl.getValue()
    if (ctrl.upsert || value) handleNext(ctrl.value, merge(ctrl.getValue(), newValue))
  }

}

export { ObjectDataService as DataService }

export default ObjectDataService