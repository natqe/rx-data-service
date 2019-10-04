import { Delete } from './delete'
import { Upsert } from './upsert'
import { Load } from './load'
import { DataService, AbstractDataService } from './service'

const rxDataService = {
  DataService,
  Delete,
  Upsert,
  Load,
  AbstractDataService
}

export {
  rxDataService,
  DataService,
  Delete,
  Upsert,
  Load,
  AbstractDataService
}

export default rxDataService