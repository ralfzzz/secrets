require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
})

const secret = process.env.DB_SECRET;
// db.connect()

function getCurrentTimestamp() {
    return new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
}
const currentTimestamp = getCurrentTimestamp();

const insert = async (email,password) => {
    try {
        const client = await pool.connect()
        await client.query(`INSERT INTO public.user (email,password) VALUES ($1, pgp_sym_encrypt($2,$3))`, [email, password,secret]); // sends queries
        client.release();            // closes connection
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const checkLogin = async (email,password) => {
    try {
        const client = await pool.connect()
        var check = await client.query(`SELECT pgp_sym_decrypt(password::bytea,$2) as password,email FROM public.user WHERE email=$1`, [email,secret]); // sends queries
        client.release();            // closes connection
        if (check.rows[0]){
            return check.rows[0];
        }

    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const checkRegister = async (email) => {
    try {
        const client = await pool.connect()
        var check = await client.query(`SELECT count(*) FROM public.user WHERE email=($1)`, [email]); // sends queries
        client.release();            // closes connection
        return(check.rows[0].count);
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const checkAndGenerateUserOauth2 = async (googleId, displayName, email) => {
    try {
        const client = await pool.connect();
        const checkResult = await client.query(`SELECT * FROM public.oauth2 WHERE google_id=($1)`, [googleId]);
        const rowCount = checkResult.rowCount;
        client.release();
        
        if (rowCount === 0) {
            const insertResult = await client.query('INSERT INTO public.oauth2(google_id,display_name,email,created_at) VALUES($1,$2,$3,$4) RETURNING *', [googleId,displayName,email,currentTimestamp]);
            
            if (insertResult.rows.length > 0) {
                return insertResult.rows[0];
            } else {
                console.error('Failed to insert new record.');
                return false;
            }
        } else {
            return checkResult.rows[0];
        }
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const insertSecret = async (secrets,writers) => {
    try {
        const client = await pool.connect()
        await client.query(`INSERT INTO public.secrets (secrets,writers,inserted_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`, [secrets, writers]);
        client.release();
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const getSecret = async () => {
    try {
        const client = await pool.connect()
        var getSecretDataFromDB = await client.query(`SELECT secrets FROM public.secrets`);
        client.release();
        if (getSecretDataFromDB.rows){
            return getSecretDataFromDB.rows;
        }
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};


module.exports = { insert, checkLogin, checkRegister, checkAndGenerateUserOauth2, insertSecret, getSecret}

