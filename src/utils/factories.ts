import { faker } from '@faker-js/faker';

export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  postalCode: string;
};

/** Dynamic data: a fresh customer for every test, so runs never collide. */
export function newCustomer(overrides: Partial<Customer> = {}): Customer {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName, provider: 'example.test' }).toLowerCase(),
    postalCode: faker.location.zipCode(),
    ...overrides,
  };
}
