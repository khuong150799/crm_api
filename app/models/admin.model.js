const Admin = function (admin) {
    (this.name = admin.name),
        (this.account = admin.account),
        (this.password = admin.password),
        (this.text_pass = admin.text_pass),
        (this.email = admin.email),
        (this.role_id = admin.role_id),
        (this.type = admin.type),
        (this.refresh_token = admin.refresh_token),
        (this.active = admin.active),
        (this.expired_on = admin.expired_on),
        (this.created_at = admin.created_at),
        (this.updated_at = admin.updated_at);
};

module.exports = Admin;
