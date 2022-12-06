import { BaseRepository, jsonIgnored, Page } from '@gcorptools/typeorm-helper';
import { newDb } from 'pg-mem';
import { mapped, nested, toDto } from '..';
import { GenericDto } from '../../dtos';
import { GenericModel } from '../../models';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { JsonIgnoreMixins } from '../../mixins';

describe('Dto utils', () => {
  let connection: any;
  let personRepository: BaseRepository<Person>;

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
      entities: [Card, Person, Address, Job],
      synchronize: true
    });
    personRepository = new BaseRepository(Person, connection.manager);
    await connection.initialize();
  });

  afterAll((done) => {
    connection?.destroy();
    done();
  });

  const _newPerson = async () => {
    const addressData = {
      street: 'A street',
      zip: 'A zip',
      city: 'A city'
    };
    const jobData = {
      name: 'Developer'
    };
    const cardsData = [
      {
        number: '1234'
      },
      {
        number: '5678'
      }
    ];
    const personData = personRepository.create({
      firstName: 'User',
      lastName: 'USER',
      secret: 'A secret',
      job: jobData,
      address: addressData,
      cards: cardsData
    });
    return await personRepository.save(personData);
  };

  const _newPersons = async (size: number) =>
    await Promise.all(
      Array.from(Array(size)).map(async (nothing: any) => await _newPerson())
    );

  const _validPerson = (
    person: Person,
    expectCards: boolean = true
  ): boolean => {
    const converted = toDto(PersonDto, person) as PersonDto;
    // Person
    expect(converted).not.toBeNull();
    expect(converted instanceof PersonDto).toEqual(true);
    expect(converted.id).toEqual(person.id);
    expect(converted.firstName).toEqual(person.firstName);
    expect(converted.lastName).toEqual(person.lastName);
    expect((converted as any).password).toBeUndefined();

    // Address
    const address = converted.address;
    expect(!!address).toEqual(true);
    expect(address instanceof AddressDto).toEqual(true);
    expect(address.street).toEqual(person.address.street);
    expect(address.zip).toEqual(person.address.zip);
    expect(address.city).toEqual(person.address.city);

    // Cards
    if (expectCards) {
      const cards = converted.cards;
      expect(!!cards && Array.isArray(cards)).toEqual(true);
      expect(cards[0].number).toEqual(person.cards[0].number);
      expect(cards[1].number).toEqual(person.cards[1].number);
    }

    // Mapped
    expect(converted.job).toEqual(person.job.name);
    return true;
  };

  it('should send same object when no value', async () => {
    let data: any = null;
    expect(toDto(PersonDto, data)).toBeNull();
    data = undefined;
    expect(toDto(PersonDto, data)).toBeUndefined();
    expect(toDto(PersonDto, [])).toEqual([]);
  });

  it('should be safe with empty nested values', async () => {
    let person = (await _newPersons(1))[0];
    person.cards = [];
    person = await personRepository.save(person);
    expect(_validPerson(person, false)).toEqual(true);
  });

  it('should convert records to DTO', async () => {
    const persons = await _newPersons(10);
    // Single user
    persons.forEach((person: Person) =>
      expect(_validPerson(person)).toEqual(true)
    );

    // Array of users
    const dtoPersons = toDto(PersonDto, persons) as PersonDto[];
    expect(dtoPersons.length).toEqual(10);
    dtoPersons.forEach((dtoPerson: PersonDto, index: number) =>
      expect(dtoPerson.id).toEqual(persons[index].id)
    );

    // Page of users
    const pagePerson = await personRepository.findPage({});
    const dtoPagePersons = toDto(PersonDto, pagePerson) as Page<PersonDto>;
    expect(dtoPagePersons.totalElements).toEqual(pagePerson.totalElements);
  });

  it('should safely convert to JSON', async () => {
    const data = Object.assign(new StandardJson(), { id: 3 });
    expect(data.toJSON()).toBeDefined();

    let person = (await _newPersons(1))[0];
    const dto = toDto(PersonDto, person) as PersonDto;
    const json = dto.toJSON();
    expect(json).toBeDefined();
    expect(json.firstName).toEqual(person.firstName);
    expect(json.lastName).toEqual(person.lastName);
    expect(json.secret).toBeUndefined(); //JSON ignored
    json.cards.forEach((card: any) =>
      expect(!!card.id && !!card.number).toEqual(true)
    );
  });
});

// Models
@Entity()
class Job extends GenericModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}

@Entity()
class Address extends GenericModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  street!: string;

  @Column()
  city!: string;

  @Column()
  zip!: string;
}

@Entity()
class Person extends GenericModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @jsonIgnored()
  secret!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @OneToOne(() => Address, { eager: true, cascade: true, nullable: true })
  @JoinColumn()
  address!: Address;

  @OneToOne(() => Job, { eager: true, cascade: true, nullable: true })
  @JoinColumn()
  job!: Job;

  @OneToMany(() => Card, (card) => card.owner, {
    cascade: true,
    eager: true
  })
  cards!: Card[];
}

@Entity()
class Card extends GenericModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  number!: string;

  @ManyToOne(() => Person)
  owner!: Person;
}

// DTO
class CardDto extends GenericDto {
  id!: number;
  number!: string;
}

class AddressDto extends GenericDto {
  id!: number;
  street!: string;
  zip!: string;
  city!: string;
}

class PersonDto extends GenericDto {
  id!: number;
  firstName!: string;
  lastName!: string;
  @nested(AddressDto)
  address!: AddressDto;
  @nested(CardDto, true)
  cards!: CardDto[];
  @mapped((record: any) => record.job.name)
  job!: string;
}

class StandardJson extends JsonIgnoreMixins() {
  id!: number;
}
