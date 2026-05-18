const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Prescription',
  tableName: 'prescriptions',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    user_id: { type: 'int' },
    medicine_id: { type: 'int', nullable: true },
    image_url: { type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 20, default: 'pending' },
    notes: { type: 'text', nullable: true },
    reviewed_by: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
});