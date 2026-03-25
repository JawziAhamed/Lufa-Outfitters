// Sri Lanka districts with delivery fee (LKR), ordered alphabetically within province.
// The `state` field in the delivery address is used to store the selected district.
export const SL_DISTRICTS = [
  // Western Province
  { name: 'Colombo',      province: 'Western',        fee: 250 },
  { name: 'Gampaha',      province: 'Western',        fee: 300 },
  { name: 'Kalutara',     province: 'Western',        fee: 350 },
  // Sabaragamuwa Province
  { name: 'Ratnapura',    province: 'Sabaragamuwa',   fee: 350 },
  { name: 'Kegalle',      province: 'Sabaragamuwa',   fee: 375 },
  // North Western Province
  { name: 'Kurunegala',   province: 'North Western',  fee: 400 },
  { name: 'Puttalam',     province: 'North Western',  fee: 450 },
  // Central Province
  { name: 'Kandy',        province: 'Central',        fee: 450 },
  { name: 'Matale',       province: 'Central',        fee: 500 },
  { name: 'Nuwara Eliya', province: 'Central',        fee: 525 },
  // Southern Province
  { name: 'Galle',        province: 'Southern',       fee: 475 },
  { name: 'Matara',       province: 'Southern',       fee: 525 },
  { name: 'Hambantota',   province: 'Southern',       fee: 575 },
  // North Central Province
  { name: 'Anuradhapura', province: 'North Central',  fee: 575 },
  { name: 'Polonnaruwa',  province: 'North Central',  fee: 575 },
  // Eastern Province
  { name: 'Trincomalee',  province: 'Eastern',        fee: 600 },
  { name: 'Ampara',       province: 'Eastern',        fee: 625 },
  { name: 'Batticaloa',   province: 'Eastern',        fee: 650 },
  // Uva Province
  { name: 'Badulla',      province: 'Uva',            fee: 575 },
  { name: 'Moneragala',   province: 'Uva',            fee: 625 },
  // Northern Province
  { name: 'Vavuniya',     province: 'Northern',       fee: 650 },
  { name: 'Mannar',       province: 'Northern',       fee: 675 },
  { name: 'Kilinochchi',  province: 'Northern',       fee: 700 },
  { name: 'Jaffna',       province: 'Northern',       fee: 700 },
  { name: 'Mullaitivu',   province: 'Northern',       fee: 725 },
];

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

export const PAYMENT_METHODS = [
  { label: 'Cash on Delivery', value: 'cod' },
  { label: '3-Month Installment', value: 'installment' },
  { label: 'Gift Card', value: 'gift_card' },
];
