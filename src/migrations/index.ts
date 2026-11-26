import * as migration_20261125_133651_initial from './20261125_133651_initial'

export const migrations = [
  {
    up: migration_20261125_133651_initial.up,
    down: migration_20261125_133651_initial.down,
    name: '20261125_133651_initial',
  },
]
