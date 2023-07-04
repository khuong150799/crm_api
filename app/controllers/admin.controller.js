const { validationResult } = require('express-validator');
const db = require('../models/connectDb');
const tableName = 'tbl_admin';
const Admin = require('../models/admin.model');
const bcrypt = require('bcrypt');
const adminService = require('../services/admin.service');
const constantNotify = require('../config/constants');
const regex = require('../ultils/regex');

//getall
exports.getall = async (req, res) => {
    try {
        const dataSearch = req.query;
        let offset = 0;
        let limit = 10;
        if (dataSearch.offset) {
            offset = dataSearch.offset;
        }
        if (dataSearch.limit) {
            limit = dataSearch.limit;
        }
        adminService.getall(dataSearch, offset, limit, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: [err],
                });
            }
            const totalPage = Math.ceil(res_[0]?.total / limit);

            res_.forEach((item) => {
                delete item.total;
            });
            res.send({
                result: true,
                totalPage: totalPage ? totalPage : 0,
                data: res_,
            });
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//getbyid
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        adminService.getById(id, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: err,
                });
            }

            res.send({
                result: true,
                data: res_,
            });
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//register
exports.register = async (req, res) => {
    try {
        // Validate Request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        const { name, account, password, address, active, role_id, email } = req.body;
        if (!regex.regexAccount.test(account)) {
            return res.send({
                result: false,
                error: [{ param: 'account', msg: constantNotify.VALIDATE_ACCOUNT }],
            });
        }

        if (!regex.regexPass.test(password)) {
            return res.send({
                result: false,
                error: [
                    {
                        param: 'password',
                        msg: constantNotify.VALIDATE_PASS,
                    },
                ],
            });
        }
        //check email
        db.getConnection((err, conn) => {
            if (err) {
                console.log('connect db fail');
                return;
            }
            conn.query(`SELECT account FROM ${tableName} WHERE account = ? `, account, async (err, dataRes_) => {
                if (err) {
                    // console.log(err);
                    return res.send({
                        result: false,
                        error: [{ msg: constantNotify.ERROR }],
                    });
                }

                if (dataRes_.length !== 0) {
                    await res.send({
                        result: false,
                        error: [{ param: 'account', msg: `Account ${constantNotify.ALREADY_EXITS}` }],
                    });
                    return;
                }

                conn.query(`SELECT email FROM ${tableName} WHERE email = ? `, email, async (err, dataRes) => {
                    if (err) {
                        // console.log(err);
                        return res.send({
                            result: false,
                            error: [{ msg: constantNotify.ERROR }],
                        });
                    }

                    if (dataRes.length !== 0) {
                        await res.send({
                            result: false,
                            error: [{ param: 'email', msg: `Email ${constantNotify.ALREADY_EXITS}` }],
                        });
                        return;
                    }
                    //hash password
                    const salt = await bcrypt.genSalt(12);
                    const hashPass = await bcrypt.hash(password, salt);
                    // data insert
                    const admin = new Admin({
                        name: name,
                        role_id: role_id,
                        email: email,
                        account: account,
                        password: hashPass,
                        text_pass: password,
                        address: address,
                        type: 0,
                        refresh_token: 0,
                        active: !active ? 0 : 1,
                        expired_on: null,
                        created_at: Date.now(),
                    });
                    delete admin.updated_at;
                    // console.log(admins);

                    adminService.register(admin, async (err, res_) => {
                        if (err) {
                            res.send({ result: false, error: [err] });
                        } else {
                            conn.query(`SELECT name FROM tbl_role WHERE id = ? `, role_id, (err, dataRes) => {
                                if (err) {
                                    return res.send({
                                        result: false,
                                        error: [{ msg: constantNotify.ERROR }],
                                    });
                                }
                                admin.id = res_;
                                admin.name_role = dataRes[0]?.name;
                                admin.updated_at = 0;
                                delete admin.password;
                                delete admin.role_id;
                                delete admin.refresh_token;
                                res.send({
                                    result: true,
                                    data: {
                                        msg: constantNotify.ADD_DATA_SUCCESS,
                                        insertId: res_,
                                        newData: admin,
                                    },
                                });
                            });
                        }
                    });
                });
            });
            conn.release();
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//update
exports.update = async (req, res) => {
    try {
        // Validate Request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        const id = req.params.id;
        const { name, account, active, role_id, email } = req.body;
        if (!regex.regexAccount.test(account)) {
            return res.send({
                result: false,
                error: [{ param: 'account', msg: constantNotify.VALIDATE_ACCOUNT }],
            });
        }

        db.getConnection((err, conn) => {
            if (err) {
                console.log('connect db fail');
                return res.send({
                    result: false,
                    error: [{ msg: constantNotify.ERROR }],
                });
            }
            conn.query(`SELECT account,id FROM ${tableName} WHERE account = ? `, account, async (err, dataRes) => {
                if (err) {
                    // console.log(err);
                    return res.send({
                        result: false,
                        error: [{ msg: constantNotify.ERROR }],
                    });
                }
                // console.log(typeof dataRes[0].id);
                // console.log(typeof id);
                if (dataRes.length !== 0 && dataRes[0]?.id !== parseInt(id)) {
                    await res.send({
                        result: false,
                        error: [
                            {
                                param: 'account',
                                msg: `Account ${constantNotify.ALREADY_EXITS}`,
                            },
                        ],
                    });
                    return;
                }
                conn.query(`SELECT email,id FROM ${tableName} WHERE email = ? `, email, async (err, dataRes) => {
                    if (err) {
                        // console.log(err);
                        return res.send({
                            result: false,
                            error: [{ msg: constantNotify.ERROR }],
                        });
                    }
                    // console.log(typeof dataRes[0].id);
                    // console.log(typeof id);
                    if (dataRes.length !== 0 && dataRes[0]?.id !== parseInt(id)) {
                        await res.send({
                            result: false,
                            error: [
                                {
                                    param: 'email',
                                    msg: `Email ${constantNotify.ALREADY_EXITS}`,
                                },
                            ],
                        });
                        return;
                    }
                    const admin = new Admin({
                        name: name,
                        role_id: role_id,
                        email: email,
                        account: account,
                        active: !active ? false : true,
                        expired_on: null,
                        updated_at: Date.now(),
                    });
                    delete admin.created_at;
                    // console.log(admins);

                    adminService.update(id, admin, async (err, res_) => {
                        if (err) {
                            res.send({ result: false, error: [err] });
                        } else {
                            conn.query(`SELECT name FROM tbl_role WHERE id = ? `, role_id, (err, dataRes) => {
                                if (err) {
                                    return res.send({
                                        result: false,
                                        error: [{ msg: constantNotify.ERROR }],
                                    });
                                }
                                admin.id = id;
                                admin.name_role = dataRes[0]?.name;
                                admin.created_at = 0;
                                delete admin.password;
                                delete admin.role_id;
                                delete admin.refresh_token;
                                res.send({
                                    result: true,
                                    data: {
                                        msg: constantNotify.UPDATE_DATA_SUCCESS,
                                        id,
                                        newData: admin,
                                    },
                                });
                            });
                        }
                    });
                });
            });
            conn.release();
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        adminService.delete(id, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: err,
                });
            }

            res.send({
                result: true,
                data: { msg: constantNotify.DELETE_DATA_SUCCESS },
            });
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//updateActive
exports.updateActive = async (req, res) => {
    try {
        // console.log(123);
        const id = req.params.id;
        let active = !req.body.active ? 0 : 1;

        adminService.updateActive(id, active, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: err,
                });
            }

            res.send({
                result: true,
                data: { msg: constantNotify.UPDATE_DATA_SUCCESS },
            });
        });
    } catch (error) {
        res.send({
            result: false,
            error: [{ msg: error }],
        });
    }
};

//login
exports.login = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send({ result: false, error: errors.array() });
    }
    const { account, password } = req.body;
    if (!regex.regexAccount.test(account)) {
        return res.send({
            result: false,
            error: [{ param: 'account', msg: constantNotify.VALIDATE_ACCOUNT }],
        });
    }
    if (!regex.regexPass.test(password)) {
        return res.send({
            result: false,
            error: [
                {
                    param: 'password',
                    msg: constantNotify.PASS_FAILED,
                },
            ],
        });
    }
    adminService.login(account, password, (err, res_) => {
        if (err) {
            return res.send({
                result: false,
                error: [err],
            });
        }

        res.send({
            result: true,
            data: res_,
        });
    });
};

//refreshToken
exports.refreshToken = async (req, res) => {
    try {
        const userId = req.body.userId;
        const refreshToken = req.body.refreshToken;
        // console.log('userId', userId);
        // console.log(typeof refreshToken);
        if (!refreshToken)
            return res.send({
                result: false,
                error: [{ msg: `Refresh token ${constantNotify.NOT_EXITS}` }],
            });
        adminService.refreshToken(userId, refreshToken, (err, res_) => {
            if (err) {
                // console.log(err);
                return res.send({
                    result: false,
                    error: [err],
                });
            }
            res.send({
                result: true,
                data: [res_],
            });
        });
    } catch (error) {
        res.send({ result: false, error: [{ msg: error }] });
    }
};

//forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        const { email } = req.body;
        adminService.forgotPassword(email, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: [err],
                });
            }
            res.send({
                result: true,
                data: res_,
            });
        });
    } catch (error) {
        res.send({ result: false, error: [{ msg: error }] });
    }
};

//change password
exports.changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        const { password, passwordNew } = req.body;
        if (!regex.regexPass.test(password)) {
            return res.send({
                result: false,
                error: [
                    {
                        param: 'password',
                        msg: constantNotify.PASS_FAILED,
                    },
                ],
            });
        }
        if (!regex.regexPass.test(passwordNew)) {
            return res.send({
                result: false,
                error: [
                    {
                        param: 'passwordNew',
                        msg: constantNotify.VALIDATE_PASS,
                    },
                ],
            });
        }
        const userId = req.params.id;
        adminService.changePassword(userId, password, passwordNew, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: [err],
                });
            }
            res.send({
                result: true,
                data: res_,
            });
        });
    } catch (error) {
        res.send({ result: false, error: [{ msg: error }] });
    }
};
