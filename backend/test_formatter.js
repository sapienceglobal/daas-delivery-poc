const success = (res, { data = null, message = 'Success', statusCode = 200, pagination = null } = {}) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return body;
};

const uniqueCustomers = [{ name: 'Emily' }];

console.log("Passing Array:", success(null, uniqueCustomers));
console.log("Passing Object with data:", success(null, { data: uniqueCustomers }));
