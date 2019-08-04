import { BehaviorSubject, Observable } from 'rxjs'
import { Ctrl } from './base'

export class OCtrl<T> extends Ctrl<T>{
  create: Observable<T>
  edit: Observable<Partial<T>>
  delete: Observable<void>
  readonly removeOptions = new BehaviorSubject({ loadNext: false })
}