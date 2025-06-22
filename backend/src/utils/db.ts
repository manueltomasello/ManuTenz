import mysql, { Pool } from 'mysql2'
//ho creato il pool per troppe connessione che si creavano, la singola connessione creava errori
export const connection: Pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gestionale_manutenzioni',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
