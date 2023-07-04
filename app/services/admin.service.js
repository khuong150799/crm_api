const db = require('../models/connectDb');
const tableName = 'tbl_admin';
const constantNotify = require('../config/constants');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwts = require('../helper/auth.helper');
const { TOKEN_TIME_LIFE, ACCESS_TOKEN, REFRESH_TOKEN, REFRESH_TOKEN_TIME_LIFE } = constantNotify;

//getall
exports.getall = async (dataSearch, offset, limit, result) => {
    try {
        let keyword = '';
        let role = '';
        const innerJoin = `tbl_role INNER JOIN ${tableName} ON tbl_role.id = ${tableName}.role_id `;
        const selectCount = `SELECT COUNT(*) FROM ${innerJoin}`;
        const selectData = `${tableName}.id,${tableName}.name,tbl_role.name as name_role,${tableName}.account,${tableName}.email,${tableName}.active,${tableName}.created_at,${tableName}.updated_at`;
        let where = 'WHERE type = 0';
        let query = `SELECT ${selectData},(${selectCount} ${where} ) as total FROM ${innerJoin} ${where}  ORDER BY ${tableName}.id DESC LIMIT ${offset},${limit}`;

        if (dataSearch.keyword && !dataSearch.role) {
            keyword = dataSearch.keyword;
            //type = 0 là những tài khoản thường, type = 1 là tai khoản admin 9 và duy nhất
            where = `WHERE (${tableName}.name LIKE "%${keyword}%" OR ${tableName}.account LIKE "%${keyword}%" OR ${tableName}.email LIKE "%${keyword}%") AND type = 0`;

            query = `SELECT ${selectData},(${selectCount} ${where}) as total FROM ${innerJoin} ${where} ORDER BY ${tableName}.id DESC LIMIT ${offset},${limit}`;
        }
        if (!dataSearch.keyword && dataSearch.role) {
            role = dataSearch.role;
            where = `WHERE ${tableName}.role_id LIKE "%${role}%" AND type = 0`;
            query = `SELECT ${selectData},(${selectCount} ${where}) as total FROM ${innerJoin} ${where} ORDER BY ${tableName}.id DESC LIMIT ${offset},${limit}`;
        }
        if (dataSearch.keyword && dataSearch.role) {
            role = dataSearch.role;
            keyword = dataSearch.keyword;
            where = `WHERE ${tableName}.role_id LIKE "%${role}%" AND (${tableName}.name LIKE "%${keyword}%" OR ${tableName}.account LIKE "%${keyword}%" OR ${tableName}.email LIKE "%${keyword}%") AND type = 0`;
            query = `SELECT ${selectData},(${selectCount} ${where}) as total FROM ${innerJoin} ${where} ORDER BY ${tableName}.id DESC LIMIT ${offset},${limit}`;
        }

        db.query(query, (err, dataRes) => {
            // console.log(query);
            if (err) {
                // console.log(err);
                return result({ msg: constantNotify.ERROR }, null);
            }
            // console.log(dataRes);
            result(null, dataRes);
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//getByID
exports.getById = async (id, result) => {
    try {
        const query = `SELECT * FROM ${tableName} WHERE ${tableName}.id =?`;

        db.query(query, id, (err, dataRes) => {
            if (err) {
                return result({ msg: constantNotify.ERROR }, null);
            }
            result(null, dataRes);
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//register
exports.register = async (data, result) => {
    try {
        const query = `INSERT INTO ${tableName} SET ?`;
        db.query(query, data, async (err, dataRes) => {
            if (err) {
                // console.log(err);
                return result({ msg: constantNotify.ERROR }, null);
            }

            result(null, dataRes.insertId);
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//update
exports.update = async (id, data, result) => {
    try {
        const query = `UPDATE ${tableName} SET name =?, role_id = ?,email=?,account =?,active =?,updated_at=? WHERE id =?`;
        db.query(
            query,
            [data.name, data.role_id, data.email, data.account, data.active, data.updated_at, id],
            (err, dataRes) => {
                if (err) {
                    return result({ msg: constantNotify.ERROR }, null);
                }
                if (dataRes.affectedRows === 0) {
                    return result({ msg: `id ${constantNotify.NOT_EXITS}` }, null);
                }
                result(null, dataRes.insertId);
            },
        );
    } catch (error) {
        result({ msg: error }, null);
    }
};

//delete
exports.delete = async (id, result) => {
    try {
        const query = `DELETE FROM ${tableName} WHERE id =?`;

        db.query(query, id, (err, dataRes) => {
            if (err) {
                return result({ msg: constantNotify.ERROR }, null);
            }
            if (dataRes.affectedRows === 0) {
                return result({ msg: `id ${constantNotify.NOT_EXITS}` });
            }
            result(null, dataRes);
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//updateActive
exports.updateActive = async (id, active, result) => {
    try {
        const query = `UPDATE ${tableName} SET active = ? WHERE id = ?`;

        db.query(query, [active, id], (err, dataRes) => {
            if (err) {
                return result({ msg: constantNotify.ERROR }, null);
            }
            if (dataRes.affectedRows === 0) {
                return result({ msg: `id ${constantNotify.NOT_EXITS}` });
            }
            result(null, dataRes);
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//login
exports.login = async (account, password, result) => {
    // console.log(account);
    // console.log(password);
    try {
        db.getConnection((err, conn) => {
            if (err) {
                // console.log(err);
                console.log('Unable to connect to database. Please check again.');
                return result({ msg: err }, null);
            }
            conn.query(
                `SELECT id,active, password FROM ${tableName} WHERE account = ?`,
                account,
                async (err, dataRes) => {
                    try {
                        if (err) {
                            return result({ msg: constantNotify.ERROR }, null);
                        }

                        if (dataRes.length === 0) {
                            return result(
                                {
                                    param: 'account',
                                    msg: constantNotify.ACCOUNT_FAILED,
                                },
                                null,
                            );
                        }
                        if (dataRes[0].active === 0) {
                            return result(
                                {
                                    param: 'account',
                                    msg: constantNotify.NOT_ACTIVE_ACCOUNT,
                                },
                                null,
                            );
                        }
                        if (dataRes[0]?.expired_on < Date.now() / 1000 && dataRes[0]?.expired_on !== null) {
                            return result(
                                {
                                    param: 'password',
                                    msg: constantNotify.EXPIRED_ON_PASS,
                                },
                                null,
                            );
                        }
                        // console.log(dataRes[0]);
                        const passMatch = await bcrypt.compare(password, dataRes[0].password);
                        // console.log(passMatch);
                        if (!passMatch) {
                            return result({ param: 'password', msg: constantNotify.PASS_FAILED }, null);
                        }
                        const _token = await jwts.make(dataRes[0].id);
                        const _refreshToken = await jwts.refreshToken(dataRes[0].id);

                        const qe = `UPDATE ${tableName} SET refresh_token = ? WHERE id = ?`;
                        conn.query(qe, [_refreshToken, dataRes[0].id], (err, dataRes_) => {
                            // console.log(qe);
                            if (err) {
                                // console.log(err);
                                return result({ msg: constantNotify.ERROR }, null);
                            }
                        });
                        result(null, {
                            id: dataRes[0].id,
                            accessToken: _token,
                            refreshToken: _refreshToken,
                        });
                    } catch (error) {
                        // console.log('error', error);
                        return result({ msg: error }, null);
                    }
                },
            );
            conn.release();
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//refresh token
exports.refreshToken = async (userId, refreshToken, result) => {
    try {
        db.getConnection(async (err, conn) => {
            if (err) {
                // console.log(err);

                console.log('Unable to connect to database. Please check again.');
                result({ msg: err }, null);
                return;
            }
            const query = `SELECT * FROM ${tableName} WHERE refresh_token LIKE "%${refreshToken}%" AND id = ${userId}`;
            conn.query(query, async (err, data) => {
                // console.log(query);
                // console.log('userId', userId);
                // console.log('data', data);
                if (err) {
                    // console.log(err);
                    result({ msg: constantNotify.ERROR }, null);
                    return;
                }
                if (data.length === 0) {
                    const qe = `UPDATE ${tableName} SET refresh_token = 0 WHERE id = ${userId}`;
                    conn.query(qe, (err, data) => {
                        if (err) {
                            result({ msg: constantNotify.ERROR }, null);
                            return;
                        }
                    });
                    conn.query(`SELECT email FROM ${tableName} WHERE id = ?`, [userId], async (err, data) => {
                        if (err) {
                            // console.log(err);
                            result({ msg: constantNotify.ERROR }, null);
                            return;
                        }
                        if (data[0]?.email) {
                            // console.log('email', data[0].email);
                            const transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'leduykhuonggcd@gmail.com',
                                    pass: 'egkwhtwztzbjupvw',
                                },
                            });

                            await transporter.sendMail({
                                from: 'leduykhuonggcd@gmail.com',
                                to: data[0].email,
                                subject: 'Cảnh báo tài khoản của bạn bị xâm nhập trái phép.',
                                text: 'Vui lòng đăng nhập lại để bảo vệ tài khoản của bạn!',
                            });
                            return result({ msg: 'dangerous' }, null);
                        }
                        return result({ msg: 'dangerous' }, null);
                    });
                }
                if (data.length > 0) {
                    // console.log(123243546754);
                    await jwt.verify(refreshToken, REFRESH_TOKEN, async (err, dataVerify) => {
                        if (err) {
                            // console.log(err);
                            return result({ msg: err });
                        }

                        const accessToken = await jwt.sign({ userId }, constantNotify.ACCESS_TOKEN, {
                            expiresIn: constantNotify.TOKEN_TIME_LIFE,
                        });
                        const refreshToken = await jwt.sign({ userId }, constantNotify.REFRESH_TOKEN, {
                            expiresIn: constantNotify.REFRESH_TOKEN_TIME_LIFE,
                        });

                        const qe = `UPDATE ${tableName} SET refresh_token = ? WHERE id = ?`;
                        conn.query(qe, [refreshToken, userId], (err, data) => {
                            if (err) {
                                // console.log(err);
                                result({ msg: constantNotify.ERROR }, null);
                                return;
                            }
                        });
                        result(null, { accessToken, refreshToken });
                    });
                }
            });
            conn.release();
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//forgot password
exports.forgotPassword = async (email, result) => {
    try {
        db.getConnection((err, conn) => {
            if (err) {
                console.log('connection db fail');
                return result({ msg: err }, null);
            }
            conn.query(`SELECT id, email FROM ${tableName} WHERE email = ?`, email, async (err, dataRes) => {
                if (err) {
                    return result({ msg: constantNotify.ERROR }, null);
                }
                if (dataRes.length <= 0) {
                    result({ msg: 'Email không tồn tại' }, null);
                    return;
                }
                const stringA_Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const stringa_z = 'abcdefghijklmnopqrstuvwxyz';
                const number = '0123456789';
                let passwordNew = '';
                for (let i = 0; i < 3; i++) {
                    passwordNew += stringA_Z.charAt(Math.floor(Math.random() * stringA_Z.length));
                }
                for (let i = 0; i < 3; i++) {
                    passwordNew += stringa_z.charAt(Math.floor(Math.random() * stringa_z.length));
                }
                for (let i = 0; i < 2; i++) {
                    passwordNew += number.charAt(Math.floor(Math.random() * number.length));
                }
                const salt = await bcrypt.genSalt(12);
                const hashPass = await bcrypt.hash(passwordNew, salt);
                const id = dataRes[0].id;
                const expired_on = Date.now() / 1000 + 5 * 60;
                conn.query(
                    `UPDATE ${tableName} SET password = ?,text_pass=?, expired_on = ? WHERE id = ?`,
                    [hashPass, passwordNew, expired_on, id],
                    async (err, dataRes) => {
                        if (err) {
                            return result({ msg: constantNotify.ERROR }, null);
                        }
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'leduykhuonggcd@gmail.com',
                                pass: 'egkwhtwztzbjupvw',
                            },
                        });

                        await transporter.sendMail({
                            from: 'leduykhuonggcd@gmail.com',
                            to: email,
                            subject: 'Cấp lại mật khẩu tài khoản',
                            text: `Mật khẩu mới là ${passwordNew}, chỉ tồn tại trong vòng 5 phút. Vui lòng truy cập vào ứng dụng hoặc websie để đăng nhập và đổi lại mật khẩu để tiếp tục sử dụng!`,
                        });
                        result(null, {
                            msg: 'Vui lòng kiểm tra email để nhận lại mật khẩu!',
                        });
                    },
                );
            });
            conn.release();
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};

//changePassword
exports.changePassword = async (id, password, passwordNew, result) => {
    try {
        db.getConnection((err, conn) => {
            if (err) {
                console.log('connection db fail');
                return result({ msg: err }, null);
            }
            conn.query(`SELECT password FROM ${tableName} WHERE id = ?`, id, async (err, dataRes) => {
                if (err) {
                    return result({ msg: constantNotify.ERROR }, null);
                }
                const passMatch = await bcrypt.compare(password, dataRes[0].password);
                if (!passMatch) {
                    return result({ param: 'password', msg: constantNotify.PASS_OLD_FAILED }, null);
                }
                const salt = await bcrypt.genSalt(12);
                const hashPass = await bcrypt.hash(passwordNew, salt);
                conn.query(
                    `UPDATE ${tableName} SET password = ?,text_pass = ?,expired_on=? WHERE id = ?`,
                    [hashPass, passwordNew, null, id],
                    (err, dataRes) => {
                        if (err) {
                            // console.log(err);
                            return result({ msg: constantNotify.ERROR }, null);
                        }
                        result(null, { msg: constantNotify.CHANGE_PASS_SUCCESS });
                    },
                );
            });
            conn.release();
        });
    } catch (error) {
        result({ msg: error }, null);
    }
};
