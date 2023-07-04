const isAuth = async function (req, res, next) {
    var jwt = require('../helper/auth.helper');
    var authorizationHeader = req.headers.authorization;
    // console.log('authorizationHeader', authorizationHeader);
    const _token = authorizationHeader?.split(' ')[1];
    if (_token) {
        // console.log('123');
        try {
            await jwt
                .checkToken(_token)
                .then((data) => {
                    // console.log(data);
                    next();
                })
                .catch((err) => {
                    res.send({
                        result: false,
                        error: [{ msg: err.message }],
                    });
                });
            // console.log('au', authData);
            // req.auth = authData;
        } catch (error) {
            // console.log(error);
            return res.send({ result: false, msg: 'Invalid token or token expired' });
        }
    } else {
        return res.send({ result: false, msg: 'Token does not exist' });
    }
};

module.exports = {
    isAuth: isAuth,
};
