import { BaseRepository } from '@gcorptools/typeorm-helper';
import { newDb } from 'pg-mem';
import { Country } from './01-model';

let connection: any;
export let countryRepository: BaseRepository<Country>;

beforeEach(async () => {
  const db = newDb({
    autoCreateForeignKeyIndices: true
  });
  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database'
  });
  db.public.registerFunction({
    implementation: () => 'version',
    name: 'version'
  });

  connection = await db.adapters.createTypeormDataSource({
    name: 'myTestDB',
    type: 'postgres',
    entities: [Country],
    synchronize: true
  });
  // In a real environment, we must create a real connection and use its manager
  // for constructing the repository instance
  countryRepository = new BaseRepository(Country, connection.manager);
  await connection.initialize();
});

afterAll((done) => {
  connection?.destroy();
  done();
});
