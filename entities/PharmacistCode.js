const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'PharmacistCode',
  tableName: 'pharmacist_codes',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    code: { type: 'varchar', length: 50, unique: true },
    is_used: { type: 'boolean', default: false },
    created_by: { type: 'int', nullable: true },
    used_by: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
});