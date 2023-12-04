const { Pool } = require('pg');
const InvariatError = require('../../exceptions/InvariantError');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const NotFoundError = require('../../exceptions/NotFoundError');

class UsersService {
    constructor(){
        this._pool = new Pool();
    }

    async addUser({ username, password, fullname }) {
        // Verifikasi username, pastikan belum terdaftar.
        await this.verifyNewUsername(username);
        // Bila verifikasi lolos, maka masukkan user baru ke database.
        const id = `user-${nanoid(16)}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = {
            text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
            values: [id, username, hashedPassword, fullname]
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariatError('User gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async verifyNewUsername(username){
        const query = {
            text: 'SELECT username FROM users WHERE username = $1',
            values: [username],
        };

        const result = await this._pool.query(query);

        if (result.rows.length > 0) {
            throw new InvariatError('Gagal menambahkan user. Username sudah digunakan.');
        }
    }

    async getUserById(userId){
        const query = {
            text: 'SELECT id, username, fullname FROM users WHERE id = $1',
            values: [userId]
        };

        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('User tidak ditemukan');
        }

        return result.rows[0];
    }
}

module.exports = UsersService;