import { getNested, nested } from '..';

describe('Field Utils', () => {
  it('should get empty values with types', () => {
    expect(getNested(NoMetadata)).toEqual([]);
    expect(getNested(Parent)).toEqual([]);
    expect(getNested(Child)).toEqual([]);
    expect(getNested(Person)).toEqual([]);
  });

  it('should get metadata accordingly to class definition', () => {
    const noMetadata = new NoMetadata();
    let nestedFields = getNested(noMetadata);
    expect(nestedFields).toEqual([]);

    const parent = new Parent();
    nestedFields = getNested(parent);
    expect(nestedFields).toEqual([
      { field: 'metadata', builder: NoMetadata, array: false }
    ]);

    const child = new Child();
    nestedFields = getNested(child);
    expect(nestedFields).toEqual([]);

    const person = new Person();
    nestedFields = getNested(person);
    expect(nestedFields).toEqual([
      { field: 'parent', builder: Parent, array: false },
      { field: 'children', builder: Child, array: true }
    ]);
  });
});

class NoMetadata {
  id!: number;
  createdAt!: Date;
}

class Parent {
  code!: string;
  @nested(NoMetadata)
  metadata!: NoMetadata;
}

class Child {
  alpha!: string;
  beta!: boolean;
}

class Person {
  age!: string;
  @nested(Parent)
  parent!: Parent;
  @nested(Child, true)
  children!: Child[];
}
