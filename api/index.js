const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Koneksi Database Neon (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Koneksi database gagal:', err.stack);
        return;
    }
    console.log('Berhasil terhubung ke database Neon (PostgreSQL)!');
    release();
});

// 2. Endpoint API Filter Fleksibel
app.get('/api/products/filter', async (req, res) => {
    try {
        const category = req.query.category;
        const gender = req.query.gender;
        const search = req.query.search;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const offset = (page - 1) * limit;

        let conditions = ['1=1'];
        let params = [];
        let paramIndex = 1;

        if (category) {
            conditions.push(`category = $${paramIndex++}`);
            params.push(category);
        }

        if (gender) {
            conditions.push(`(gender = $${paramIndex++} OR gender = 'Unisex')`);
            params.push(gender);
        }

        if (search) {
            conditions.push(`name ILIKE $${paramIndex++}`);
            params.push(`%${search}%`);
        }

        const whereClause = conditions.join(' AND ');
        const countSql = `SELECT COUNT(*) as total FROM _products WHERE ${whereClause}`;

        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        let sql = `SELECT * FROM _products WHERE ${whereClause}`;
        const sort = req.query.sort;
        if (sort === 'price_asc') {
            sql += ' ORDER BY price ASC';
        } else if (sort === 'price_desc') {
            sql += ' ORDER BY price DESC';
        } else if (sort === 'oldest') {
            sql += ' ORDER BY id ASC';
        } else {
            sql += ' ORDER BY id DESC';
        }

        sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const results = await pool.query(sql, params);
        res.json({
            products: results.rows,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Endpoint API New Arrivals
app.get('/api/products/new-arrivals', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM _products');
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        const sort = req.query.sort;
        let sql = 'SELECT * FROM _products';
        if (sort === 'price_asc') {
            sql += ' ORDER BY price ASC';
        } else if (sort === 'price_desc') {
            sql += ' ORDER BY price DESC';
        } else if (sort === 'oldest') {
            sql += ' ORDER BY id ASC';
        } else {
            sql += ' ORDER BY id DESC';
        }
        sql += ' LIMIT $1 OFFSET $2';

        const results = await pool.query(sql, [limit, offset]);
        res.json({
            products: results.rows,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Endpoint API Single Product
app.get('/api/products/detail/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const productResult = await pool.query('SELECT * FROM _products WHERE id = $1', [id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        const imagesResult = await pool.query('SELECT * FROM _product_images WHERE product_id = $1', [id]);
        product.images = imagesResult.rows;

        const sizesResult = await pool.query('SELECT * FROM _product_sizes WHERE product_id = $1', [id]);
        product.sizes = sizesResult.rows;

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Endpoint API Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Harap isi semua field' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM _users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertSql = 'INSERT INTO _users (name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id';
        const result = await pool.query(insertSql, [name, email, hashedPassword]);

        res.status(201).json({ message: 'Registration successful', userId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Endpoint API Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password must be filled' });
        }

        const result = await pool.query('SELECT * FROM _users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Email or password incorrect' });
        }

        delete user.password;
        res.json({ message: 'Login successfull', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Endpoints API Cart
app.get('/api/cart', async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) return res.status(400).json({ error: 'user_id diperlukan' });

        const sql = `
            SELECT c.id as cart_id, c.user_id, c.product_id, c.size, c.quantity,
                   p.name, p.price, p.image, p.category,
                   (SELECT stock FROM _product_sizes WHERE product_id = c.product_id AND size_name = c.size LIMIT 1) as stock
            FROM _cart c
            LEFT JOIN _products p ON c.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.id DESC
        `;
        const results = await pool.query(sql, [userId]);
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        const { user_id, product_id, size, quantity } = req.body;
        if (!user_id || !product_id || !size) return res.status(400).json({ error: 'Data tidak lengkap' });

        const qty = quantity || 1;

        const checkSql = 'SELECT id, quantity FROM _cart WHERE user_id = $1 AND product_id = $2 AND size = $3';
        const checkResult = await pool.query(checkSql, [user_id, product_id, size]);

        if (checkResult.rows.length > 0) {
            const cartId = checkResult.rows[0].id;
            const newQty = checkResult.rows[0].quantity + qty;
            await pool.query('UPDATE _cart SET quantity = $1 WHERE id = $2', [newQty, cartId]);
            res.json({ message: 'Quantity updated', cart_id: cartId, new_quantity: newQty });
        } else {
            const insertSql = 'INSERT INTO _cart (user_id, product_id, size, quantity) VALUES ($1, $2, $3, $4) RETURNING id';
            const insertResult = await pool.query(insertSql, [user_id, product_id, size, qty]);
            res.status(201).json({ message: 'Item added to cart', cart_id: insertResult.rows[0].id });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/cart/:id', async (req, res) => {
    try {
        const cartId = req.params.id;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity tidak valid' });

        await pool.query('UPDATE _cart SET quantity = $1 WHERE id = $2', [quantity, cartId]);
        res.json({ message: 'Quantity updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cart/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        await pool.query('DELETE FROM _cart WHERE user_id = $1', [userId]);
        res.json({ message: 'All items removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cart/:id', async (req, res) => {
    try {
        const cartId = req.params.id;
        await pool.query('DELETE FROM _cart WHERE id = $1', [cartId]);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Endpoints API Profile
app.put('/api/auth/update-name', async (req, res) => {
    try {
        const { user_id, new_name } = req.body;
        if (!user_id || !new_name) return res.status(400).json({ error: 'user_id dan new_name diperlukan' });

        const result = await pool.query('UPDATE _users SET name = $1 WHERE id = $2', [new_name, user_id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ message: 'Username updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/auth/change-password', async (req, res) => {
    try {
        const { user_id, current_password, new_password } = req.body;
        if (!user_id || !current_password || !new_password) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }

        const result = await pool.query('SELECT password FROM _users WHERE id = $1', [user_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(current_password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Password saat ini salah' });
        }

        const hashedNewPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE _users SET password = $1 WHERE id = $2', [hashedNewPassword, user_id]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/auth/delete-account/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.query('DELETE FROM _cart WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM _users WHERE id = $1', [userId]);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Endpoint API Complete Order (Payment)
app.post('/api/orders/complete', async (req, res) => {
    const client = await pool.connect();
    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ error: 'user_id diperlukan' });

        const itemsResult = await client.query('SELECT * FROM _cart WHERE user_id = $1', [user_id]);
        const items = itemsResult.rows;

        if (items.length === 0) return res.status(400).json({ error: 'Keranjang kosong' });

        await client.query('BEGIN');

        for (let item of items) {
            const updateStockSql = 'UPDATE _product_sizes SET stock = stock - $1 WHERE product_id = $2 AND size_name = $3';
            await client.query(updateStockSql, [item.quantity, item.product_id, item.size]);
        }

        await client.query('DELETE FROM _cart WHERE user_id = $1', [user_id]);
        await client.query('COMMIT');

        res.json({ message: 'Pembayaran berhasil dikonfirmasi, stok telah diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Gagal memproses pesanan: ' + err.message });
    } finally {
        client.release();
    }
});

// 12. Export untuk Vercel Serverless
module.exports = app;
