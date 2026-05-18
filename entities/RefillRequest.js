const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'RefillRequest',
  tableName: 'refill_requests',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    user_id: { type: 'int' },
    prescription_id: { type: 'int' },
    status: { type: 'varchar', length: 20, default: 'pending' },
    notes: { type: 'text', nullable: true },
    reviewed_by: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
});