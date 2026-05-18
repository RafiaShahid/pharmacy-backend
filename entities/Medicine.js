const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Medicine',
  tableName: 'medicines',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar', length: 150 },
    description: { type: 'text', nullable: true },
    price: { type: 'decimal', precision: 10, scale: 2 },
    stock: { type: 'int', default: 0 },
    category: { type: 'varchar', length: 100, nullable: true },
    requires_prescription: { type: 'boolean', default: false },
    image_url: { type: 'varchar', length: 255, nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
});