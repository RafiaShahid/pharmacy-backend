const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'OrderItem',
  tableName: 'order_items',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    order_id: { type: 'int' },
    medicine_id: { type: 'int', nullable: true },
    quantity: { type: 'int' },
    price: { type: 'decimal', precision: 10, scale: 2 },
  },
});