const router = require('express').Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const jwtMiddelwear = require('../middlewares/jwt.middleware');

module.exports = (app) => {
    router.get('/getall', jwtMiddelwear.isAuth, adminController.getall);
    router.get('/getbyid/:id', jwtMiddelwear.isAuth, adminController.getById);
    router.post(
        '/register',
        [
            body('name', 'Tên không được bỏ trống').notEmpty(),
            body('account', 'Tên tài khoản không được bỏ trống và phải viết liền không dấu').notEmpty(),
            body('email', 'Trường này phải là email').isEmail(),
            body('email', 'Email không được bỏ trống').notEmpty(),
            body('password', 'Mật khẩu không được bỏ trống').notEmpty(),
            body('password', 'Mật khẩu ít nhất là 8 kí tự').isLength({ min: 8 }),
            body('role_id', 'Nhóm quyền không được bỏ trống').notEmpty(),
        ],
        jwtMiddelwear.isAuth,
        adminController.register,
    );
    router.put(
        '/updatebyid/:id',
        [
            body('name', 'Tên không được bỏ trống').notEmpty(),
            body('account', 'Tên tài khoản không được bỏ trống và phải viết liền không dấu').notEmpty(),
            body('email', 'Trường này phải là email').isEmail(),
            body('email', 'Email không được bỏ trống').notEmpty(),
            body('role_id', 'Nhóm quyền không được bỏ trống').notEmpty(),
        ],
        jwtMiddelwear.isAuth,
        adminController.update,
    );
    router.delete('/delete/:id', jwtMiddelwear.isAuth, adminController.delete);
    router.put('/update-active/:id', jwtMiddelwear.isAuth, adminController.updateActive);
    router.post(
        '/login',
        [
            body('account', 'Tên đăng nhập không thể bỏ trống').notEmpty(),
            body('password', 'Mật khẩu không thể bỏ trống').notEmpty(),
            body('password', 'Mật khẩu ít nhất là 8 kí tự').isLength({ min: 8 }),
        ],
        adminController.login,
    );
    router.post('/refresh-token', adminController.refreshToken);
    router.post(
        '/forgot-password',
        [body('email', 'Email không được bỏ trống').notEmpty(), body('email', 'Trường này phải lài email').isEmail()],
        adminController.forgotPassword,
    );
    router.put(
        '/change-password/:id',
        [
            body('password', 'Password không được bỏ trống').notEmpty(),
            body('password', 'Mật khẩu ít nhất là 8 kí tự').isLength({ min: 8 }),
            body('passwordNew', 'Mật khẩu mới không được bỏ trống').notEmpty(),
            body('passwordNew', 'Mật khẩu mới ít nhất là 8 kí tự').isLength({
                min: 8,
            }),
        ],
        jwtMiddelwear.isAuth,
        adminController.changePassword,
    );

    app.use('/api/admin', router);
};
