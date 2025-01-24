const { convertSQLToORM } = require('../services/sqlToOrm');


// POST /api/converter
const convert = (req, res) => {
  const { sqlCode, orm } = req.body;

  if (!sqlCode || !orm) {
    return res.status(400).json({ error: 'SQL code and ORM type are required.' });
  }

  try {
    const ormCode = convertSQLToORM(sqlCode, orm);
    res.status(200).json({ ormCode });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to convert SQL to ORM', details: error.message });
  }
};

module.exports = { convert };
