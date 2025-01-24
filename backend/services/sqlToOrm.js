const { Parser } = require('node-sql-parser');
const parser = new Parser();

const convertSQLToORM = (sqlCode, orm) => {
  const ast = parser.astify(sqlCode); // Convert SQL to AST (Abstract Syntax Tree)

  if (orm === 'sequelize') {
    return generateSequelizeCode(ast);
  } else if (orm === 'sqlalchemy') {
    return generateSQLAlchemyCode(ast);
  } else {
    throw new Error('Unsupported ORM type');
  }
};

// Generate Sequelize code
const generateSequelizeCode = (ast) => {
  // Example: Handle CREATE TABLE statements
  if (ast.type === 'create') {
    const tableName = ast.table[0].table;
    const columns = ast.create_definitions.map((col) => {
      return `${col.column.column} : { type: '${col.datatype.type.toUpperCase()}' }`;
    });

    return `const ${tableName} = sequelize.define('${tableName}', {\n  ${columns.join(',\n  ')}\n});`;
  }

  throw new Error('Unsupported SQL structure for Sequelize');
};

// Generate SQLAlchemy code
const generateSQLAlchemyCode = (ast) => {
  // Similar logic for SQLAlchemy
  if (ast.type === 'create') {
    const tableName = ast.table[0].table;
    const columns = ast.create_definitions.map((col) => {
      return `${col.column.column} = Column('${col.datatype.type.toUpperCase()}')`;
    });

    return `class ${tableName}(Base):\n    __tablename__ = '${tableName}'\n    ${columns.join('\n    ')}`;
  }

  throw new Error('Unsupported SQL structure for SQLAlchemy');
};

module.exports = { convertSQLToORM };
