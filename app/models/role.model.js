const Role = function (role) {
  (this.name = role.name),
    (this.publish = role.publish),
    (this.created_at = role.created_at),
    (this.updated_at = role.updated_at);
};

module.exports = Role;
