import { BehaviorSubject, Observable } from 'rxjs'
import { DataServiceCtrl } from './base'

export class ObjectDataServiceCtrl<T> extends DataServiceCtrl<T>{
  create: Observable<T>
  edit: Observable<Partial<T>>
  delete: Observable<void>
  readonly removeOptions = new BehaviorSubject({ loadNext: false })
}