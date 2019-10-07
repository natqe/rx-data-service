import { Delete } from './delete'
import { Upsert } from './upsert'
import { Load } from './load'
import { Insert } from './insert'
import { Update } from './update'
import { Operate } from './operate'
import { DataService, AbstractDataService } from './service'

const rxDataService = {
  DataService,
  Operate,
  Delete,
  Insert,
  Update,
  Upsert,
  Load,
  AbstractDataService
}

export {
  rxDataService,
  DataService,
  Delete,
  Insert,
  Update,
  Operate,
  Upsert,
  Load,
  AbstractDataService
}

export default rxDataService