import merge from 'lodash.merge'
import reject from 'lodash.reject'
import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { BaseDataService, getCtrl } from './__base'
import { ACtrl } from './__ctrl/array'
import { handleNext } from './__util/handle-next'
import { protectValue } from './__util/protect-value'
import { switchOnce } from './__util/switch-once'

export type arrayDataServiceOptions<T> = {
  autoLoad?: boolean
  identifierProp?: keyof T
  upsert?: boolean
}

const defaults: arrayDataServiceOptions<{ _id }> = {
  autoLoad: true,
  identifierProp: `_id`,
  upsert: true
}

const getArrayCtrl = <T>(id: number) => <ACtrl<T>>getCtrl(id)

export abstract class ArrayDataService<T> extends BaseDataService<Array<T>> {

  constructor({ autoLoad = defaults.autoLoad, identifierProp = defaults.identifierProp as keyof T, upsert = defaults.upsert } = defaults as any as arrayDataServiceOptions<T>) {
    super(new ACtrl({ autoLoad, identifierProp, upsert }))
  }

  protected set create(executer: ACtrl<T>['create']) {
    const
      ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId),
      { creating, creatingSuccess } = ctrl,
      dialCreating = <T>(value: boolean) => tap<T>(() => creating.next(value))
    if (executer instanceof Observable) ctrl.create = of(null).pipe(
      dialCreating(true),
      switchOnce(executer),
      tap(value => {
        this.add(value)
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

  protected set edit(executer: ACtrl<T>['edit']) {
    const
      ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId),
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

  protected set delete(executer: ACtrl<T>['delete']) {
    const
      ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId),
      { deleting, deletingSuccess } = ctrl,
      dialDeleting = <T>(value: boolean) => tap<T>(() => deleting.next(value))
    if (executer instanceof Observable) ctrl.delete = of(null).pipe(
      dialDeleting(true),
      switchOnce(executer),
      tap(value => {
        this.remove({ loadNext: false, conditions: value })
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
    return getArrayCtrl<T>(this.__dataServiceInstanceId).create
  }

  protected get edit() {
    return getArrayCtrl<T>(this.__dataServiceInstanceId).edit
  }

  protected get delete() {
    return getArrayCtrl<T>(this.__dataServiceInstanceId).delete
  }

  protected add(item: T) {
    const ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId)
    handleNext(ctrl.value, (ctrl.getValue() || []).concat(item))
  }

  protected remove({ loadNext = getArrayCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue().loadNext, conditions } = getArrayCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue()) {
    const
      ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId),
      { removeOptions, value } = ctrl,
      items = ctrl.getValue()
    handleNext(removeOptions, { ...removeOptions.getValue(), loadNext })
    handleNext(value, reject(items, conditions))
  }

  protected patch(newValue: Partial<T>) {
    const
      ctrl = getArrayCtrl<T>(this.__dataServiceInstanceId),
      { value, identifierProp, upsert } = ctrl,
      items = ctrl.getValue(),
      index = items.findIndex(({ [identifierProp]: id }) => id === newValue[identifierProp])
    index !== -1 ? merge(items[index], newValue) : upsert && items.push(newValue as T)
    handleNext(value, items)
  }

}

export default ArrayDataService