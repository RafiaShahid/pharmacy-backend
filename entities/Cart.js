const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Cart',
  tableName: 'cart',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    user_id: { type: 'int' },
    medicine_id: { type: 'int' },
    quantity: { type: 'int', default: 1 },
    created_at: { type: 'timestamp', createDate: true },
  },
});