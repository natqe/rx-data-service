import { Delete } from './delete'
import { Upsert } from './upsert'
import { Load, Set } from './load'
import { Insert, Create } from './insert'
import { Update } from './update'
import { Operate } from './operate'
import { DataService, AbstractDataService } from './service'

const rxDataService = {
  DataService,
  Operate,
  Delete,
  Insert,
  Create,
  Update,
  Upsert,
  Load,
  Set,
  AbstractDataService
}

export {
  rxDataService,
  DataService,
  Delete,
  Insert,
  Create,
  Update,
  Operate,
  Upsert,
  Load,
  Set,
  AbstractDataService
}

export default rxDataService