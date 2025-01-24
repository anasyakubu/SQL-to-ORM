const { Parser } = require('node-sql-parser');
const parser = new Parser();

const convertSQLToORM = (sqlCode, orm) => {
  try {
    const ast = parser.astify(sqlCode);
    
    switch (orm.toLowerCase()) {
      case 'sequelize':
        return generateSequelizeCode(ast);
      case 'sqlalchemy':
        return generateSQLAlchemyCode(ast);
      default:
        throw new Error('Unsupported ORM type');
    }
  } catch (error) {
    throw new Error(`Conversion error: ${error.message}`);
  }
};

// Generate Sequelize code
const generateSequelizeCode = (ast) => {
  switch (ast.type) {
    case 'create':
      return handleSequelizeCreateTable(ast);
    case 'insert':
      return handleSequelizeInsert(ast);
    case 'select':
      return handleSequelizeSelect(ast);
    case 'update':
      return handleSequelizeUpdate(ast);
    case 'delete':
      return handleSequelizeDelete(ast);
    default:
      throw new Error(`Unsupported SQL statement type for Sequelize: ${ast.type}`);
  }
};

// Generate SQLAlchemy code
const generateSQLAlchemyCode = (ast) => {
  switch (ast.type) {
    case 'create':
      return handleSQLAlchemyCreateTable(ast);
    case 'insert':
      return handleSQLAlchemyInsert(ast);
    case 'select':
      return handleSQLAlchemySelect(ast);
    case 'update':
      return handleSQLAlchemyUpdate(ast);
    case 'delete':
      return handleSQLAlchemyDelete(ast);
    default:
      throw new Error(`Unsupported SQL statement type for SQLAlchemy: ${ast.type}`);
  }
};

// Sequelize Handlers
const handleSequelizeCreateTable = (ast) => {
  const tableName = ast.table[0].table;
  const columns = ast.create_definitions.map((col) => {
    const columnDefinition = {
      type: mapSQLToSequelizeType(col.datatype.type),
      allowNull: !col.nullable?.value,
    };

    if (col.default) {
      columnDefinition.defaultValue = formatDefaultValue(col.default);
    }

    if (col.primary_key) {
      columnDefinition.primaryKey = true;
    }

    if (col.auto_increment) {
      columnDefinition.autoIncrement = true;
    }

    return `${col.column.column}: {
      type: DataTypes.${mapSQLToSequelizeType(col.datatype.type)},
      ${Object.entries(columnDefinition)
        .filter(([key]) => key !== 'type')
        .map(([key, value]) => `${key}: ${value}`)
        .join(',\n      ')}
    }`;
  });

  return `const ${tableName} = sequelize.define('${tableName}', {\n  ${columns.join(',\n  ')}\n});`;
};

const handleSequelizeInsert = (ast) => {
  const tableName = ast.table[0].table;
  const columns = ast.columns.map(col => col.expr.column);
  const values = ast.values[0].value.map(val => 
    typeof val.value === 'string' ? `'${val.value}'` : val.value
  );

  return `${tableName}.create({
  ${columns.map((col, index) => `${col}: ${values[index]}`).join(',\n  ')}
});`;
};

const handleSequelizeSelect = (ast) => {
  const tableName = ast.from[0].table;
  const whereClause = ast.where ? convertSequelizeWhereClause(ast.where) : '';
  
  return `${tableName}.findAll({
  ${whereClause ? `where: ${whereClause}` : ''}
});`;
};

const handleSequelizeUpdate = (ast) => {
  const tableName = ast.table[0].table;
  const updates = ast.set.map(setItem => 
    `${setItem.column.column}: ${formatDefaultValue(setItem.value)}`
  ).join(',\n    ');
  
  const whereClause = ast.where ? convertSequelizeWhereClause(ast.where) : '';

  return `${tableName}.update({
  ${updates}
}, {
  ${whereClause ? `where: ${whereClause}` : ''}
});`;
};

const handleSequelizeDelete = (ast) => {
  const tableName = ast.from[0].table;
  const whereClause = ast.where ? convertSequelizeWhereClause(ast.where) : '';

  return `${tableName}.destroy({
  ${whereClause ? `where: ${whereClause}` : ''}
});`;
};

// SQLAlchemy Handlers
const handleSQLAlchemyCreateTable = (ast) => {
  const tableName = ast.table[0].table;
  const columns = ast.create_definitions.map((col) => {
    const columnType = `Column(${mapSQLToSQLAlchemyType(col.datatype.type)}`;
    const constraints = [];

    if (col.nullable?.value === false) {
      constraints.push('nullable=False');
    }

    if (col.primary_key) {
      constraints.push('primary_key=True');
    }

    if (col.auto_increment) {
      constraints.push('autoincrement=True');
    }

    if (col.default) {
      constraints.push(`server_default='${col.default.value}'`);
    }

    return `${col.column.column} = ${columnType}${constraints.length > 0 ? ', ' + constraints.join(', ') : ''})`;
  });

  return `class ${tableName}(Base):
    __tablename__ = '${tableName}'
    ${columns.join('\n    ')}`;
};

const handleSQLAlchemyInsert = (ast) => {
  const tableName = ast.table[0].table;
  const columns = ast.columns.map(col => col.expr.column);
  const values = ast.values[0].value.map(val => 
    typeof val.value === 'string' ? `'${val.value}'` : val.value
  );

  return `new_${tableName} = ${tableName}(
  ${columns.map((col, index) => `${col}=${values[index]}`).join(',\n  ')}
)
session.add(new_${tableName})
session.commit()`;
};

const handleSQLAlchemySelect = (ast) => {
  const tableName = ast.from[0].table;
  const whereClause = ast.where ? convertSQLAlchemyWhereClause(ast.where) : '';
  
  return `session.query(${tableName})${whereClause ? `.filter(${whereClause})` : ''}.all()`;
};

const handleSQLAlchemyUpdate = (ast) => {
  const tableName = ast.table[0].table;
  const updates = ast.set.map(setItem => 
    `${setItem.column.column}=${formatDefaultValue(setItem.value)}`
  ).join(', ');
  
  const whereClause = ast.where ? convertSQLAlchemyWhereClause(ast.where) : '';

  return `session.query(${tableName})${whereClause ? `.filter(${whereClause})` : ''}.update({
  ${updates}
})
session.commit()`;
};

const handleSQLAlchemyDelete = (ast) => {
  const tableName = ast.from[0].table;
  const whereClause = ast.where ? convertSQLAlchemyWhereClause(ast.where) : '';

  return `session.query(${tableName})${whereClause ? `.filter(${whereClause})` : ''}.delete()
session.commit()`;
};

// Utility Functions
const mapSQLToSequelizeType = (sqlType) => {
  const typeMap = {
    'int': 'INTEGER',
    'varchar': 'STRING',
    'text': 'TEXT',
    'datetime': 'DATE',
    'boolean': 'BOOLEAN',
    'decimal': 'DECIMAL',
    'float': 'FLOAT',
  };
  return typeMap[sqlType.toLowerCase()] || 'STRING';
};

const mapSQLToSQLAlchemyType = (sqlType) => {
  const typeMap = {
    'int': 'Integer',
    'varchar': 'String',
    'text': 'Text',
    'datetime': 'DateTime',
    'boolean': 'Boolean',
    'decimal': 'Float',
    'float': 'Float',
  };
  return typeMap[sqlType.toLowerCase()] || 'String';
};

const formatDefaultValue = (value) => {
  if (value.type === 'string') {
    return `'${value.value}'`;
  }
  return value.value;
};

const convertSequelizeWhereClause = (whereClause) => {
  if (whereClause.type === 'binary_expr') {
    const left = whereClause.left.column || whereClause.left.expr;
    const right = formatDefaultValue(whereClause.right);
    
    return `{ ${left}: { [Op.${mapOperator(whereClause.operator)}]: ${right} } }`;
  }
  return '{}';
};

const convertSQLAlchemyWhereClause = (whereClause) => {
  if (whereClause.type === 'binary_expr') {
    const left = whereClause.left.column || whereClause.left.expr;
    const right = formatDefaultValue(whereClause.right);
    
    return `${tableName}.${left} ${mapOperator(whereClause.operator)} ${right}`;
  }
  return '';
};

const mapOperator = (sqlOperator) => {
  const operatorMap = {
    '=': 'eq',
    '!=': 'ne',
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    'LIKE': 'like',
    'IN': 'in'
  };
  return operatorMap[sqlOperator.toUpperCase()] || sqlOperator;
};

module.exports = { convertSQLToORM };