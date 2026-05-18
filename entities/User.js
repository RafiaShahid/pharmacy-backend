const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar', length: 100 },
    email: { type: 'varchar', length: 150, unique: true },
    password: { type: 'varchar', length: 255 },
    role: { type: 'varchar', length: 20, default: 'user' },
    created_at: { type: 'timestamp', createDate: true },
  },
});