import { Delete } from './delete'
import { Upsert } from './upsert'
import { Load } from './load'
import { Operate } from './operate'
import { DataService, AbstractDataService } from './service'

const rxDataService = {
  DataService,
  Operate,
  Delete,
  Upsert,
  Load,
  AbstractDataService
}

export {
  rxDataService,
  DataService,
  Delete,
  Operate,
  Upsert,
  Load,
  AbstractDataService
}

export default rxDataService