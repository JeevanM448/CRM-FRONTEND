import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getCustomers() {
  await delay();
  return store.getCustomers();
}

export async function getCustomer(id: string) {
  await delay();
  const customer = store.getCustomer(id);
  if (!customer) throw new Error("Customer not found");
  return customer;
}

export async function getTeamCustomers() {
  await delay();
  return store.getTeamCustomers();
}

export async function getTeamCustomersSummary() {
  await delay();
  return store.getTeamCustomersSummary();
}

export async function getCustomerAccessStatus(id: string) {
  await delay();
  return store.getCustomerAccessStatus(id);
}

export async function createCustomer(data: Parameters<typeof store.createCustomer>[0]) {
  await delay();
  return store.createCustomer(data);
}

export async function updateCustomer(
  id: string,
  data: Parameters<typeof store.updateCustomer>[1]
) {
  await delay();
  return store.updateCustomer(id, data);
}

export async function deleteCustomer(id: string) {
  await delay();
  store.deleteCustomer(id);
}
