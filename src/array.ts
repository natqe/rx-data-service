import merge from 'lodash.merge'
import reject from 'lodash.reject'
import { Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { BaseDataService, instances } from './__base'
import { ArrayDataServiceCtrl } from './__ctrl/array'
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

const getCtrl = <T>(id: number) => <ArrayDataServiceCtrl<T>>instances[id]

export abstract class ArrayDataService<T> extends BaseDataService<T> {

  constructor({ autoLoad = defaults.autoLoad, identifierProp = defaults.identifierProp as keyof T, upsert = defaults.upsert } = defaults as any as arrayDataServiceOptions<T>) {
    super()
    instances[this.__dataServiceInstanceId] = new ArrayDataServiceCtrl({ autoLoad, identifierProp, upsert })
  }

  protected set create(executer: ArrayDataServiceCtrl<T>['create']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
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

  protected set edit(executer: ArrayDataServiceCtrl<T>['edit']) {
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

  protected set delete(executer: ArrayDataServiceCtrl<T>['delete']) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
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
    return getCtrl<T>(this.__dataServiceInstanceId).create
  }

  protected get edit() {
    return getCtrl<T>(this.__dataServiceInstanceId).edit
  }

  protected get delete() {
    return getCtrl<T>(this.__dataServiceInstanceId).delete
  }

  protected add(item: T) {
    const ctrl = getCtrl<T>(this.__dataServiceInstanceId)
    handleNext(ctrl.value, (ctrl.getValue() || []).concat(item))
  }

  protected remove({ loadNext = getCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue().loadNext, conditions } = getCtrl<T>(this.__dataServiceInstanceId).removeOptions.getValue()) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
      { removeOptions, value } = ctrl,
      items = ctrl.getValue()
    handleNext(removeOptions, { ...removeOptions.getValue(), loadNext })
    handleNext(value, reject(items, conditions))
  }

  protected patch(newValue: Partial<T>) {
    const
      ctrl = getCtrl<T>(this.__dataServiceInstanceId),
      { value, identifierProp, upsert } = ctrl,
      items = ctrl.getValue(),
      index = items.findIndex(({ [identifierProp]: id }) => id === newValue[identifierProp])
    index !== -1 ? merge(items[index], newValue) : upsert && items.push(newValue as T)
    handleNext(value, items)
  }

}

export default ArrayDataService