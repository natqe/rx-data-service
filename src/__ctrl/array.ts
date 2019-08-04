import { BehaviorSubject, Observable } from 'rxjs'
import { DataServiceCtrl } from './base'

type arrayDataServiceCtrlOptions<T> = {
  autoLoad: boolean
  identifierProp: keyof T
  upsert: boolean
}

const defaults: arrayDataServiceCtrlOptions<{ _id }> = {
  autoLoad: true,
  identifierProp: `_id`,
  upsert: true
}

export class ArrayDataServiceCtrl<T> extends DataServiceCtrl<Array<T>>{

  create: Observable<T>
  edit: Observable<Partial<T>>
  delete: Observable<Partial<T>>
  identifierProp: keyof T

constructor({ autoLoad = defaults.autoLoad, identifierProp = defaults.identifierProp as keyof T, upsert = defaults.upsert } = defaults as any as arrayDataServiceCtrlOptions<T>){
  super({ autoLoad, upsert })
  this.identifierProp = identifierProp
}

  readonly removeOptions = new BehaviorSubject({ loadNext: false } as { loadNext?: boolean, conditions: Partial<T> })

}