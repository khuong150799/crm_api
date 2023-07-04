const Role = require('../models/role.model');
const roleServeice = require('../services/role.service');
const constantNotify = require('../config/constants');
const { validationResult } = require('express-validator');
const db = require('../models/connectDb');
const tableName = 'tbl_role';

///getall
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
        roleServeice.getall(dataSearch, offset, limit, (err, res_) => {
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
        roleServeice.getById(id, (err, res_) => {
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        db.query(`SELECT name FROM ${tableName} WHERE name LIKE "%${req.body.name}%"`, (err, dataRes_) => {
            if (err) {
                return res.send({ result: false, error: [{ msg: constantNotify.ERROR }] });
            }
            if (dataRes_?.length > 0) {
                return res.send({ result: false, error: [{ msg: `Nhóm quyền ${constantNotify.ALREADY_EXITS}` }] });
            }
            const role = new Role({
                name: req.body.name,
                publish: !req.body.publish ? 0 : 1,
                created_at: Date.now(),
            });
            delete role.updated_at;
            roleServeice.register(role, (err, res_) => {
                if (err) {
                    return res.send({
                        result: false,
                        error: err,
                    });
                }
                role.id = res_;
                role.updated_at = 0;
                res.send({
                    result: true,
                    data: {
                        msg: constantNotify.ADD_DATA_SUCCESS,
                        insertId: res_,
                        newData: role,
                    },
                });
            });
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ result: false, error: errors.array() });
        }
        const id = req.params.id;
        const role = new Role({
            name: req.body.name,
            publish: !req.body.publish ? 0 : 1,
            updated_at: Date.now(),
        });
        delete role.created_at;
        roleServeice.update(id, role, (err, res_) => {
            if (err) {
                return res.send({
                    result: false,
                    error: err,
                });
            }
            role.id = id;
            role.created_at = 0;
            res.send({
                result: true,
                data: {
                    msg: constantNotify.UPDATE_DATA_SUCCESS,
                    id,
                    newData: role,
                },
            });
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
        roleServeice.delete(id, (err, res_) => {
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

//updatePublish
exports.updatePublish = async (req, res) => {
    try {
        const id = req.params.id;
        const publish = !req.body.publish ? 0 : 1;
        roleServeice.updatePublish(id, publish, (err, res_) => {
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
