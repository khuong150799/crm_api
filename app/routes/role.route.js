const router = require("express").Router();
const { body } = require("express-validator");
const roleController = require("../controllers/role.controller");

module.exports = (app) => {
  router.get("/getall", roleController.getall);
  router.get("/getbyid/:id", roleController.getById);
  router.post(
    "/register",
    [body("name", "Trường này không được bỏ trống").notEmpty()],
    roleController.register
  );
  router.put(
    "/updatebyid/:id",
    [body("name", "Trường này không được bỏ trống").notEmpty()],
    roleController.update
  );
  router.delete("/delete/:id", roleController.delete);
  router.put("/update-publish/:id", roleController.updatePublish);

  app.use("/api/role", router);
};
