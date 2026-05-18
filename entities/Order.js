const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    user_id: { type: 'int' },
    total_amount: { type: 'decimal', precision: 10, scale: 2 },
    status: { type: 'varchar', length: 20, default: 'pending' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
});