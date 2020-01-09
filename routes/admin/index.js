const express = require("express"),
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "admin/index";

  next();
});

router.get("/", (req, res) => {
  if (req.session.user === undefined || req.session.user.userType != "2") {
    res.redirect("/login");
    //res.send("401 Authorization Error");
    return;
  }
  const sqlGetTasks =
    "SELECT tbl_users.email,tbl_users.first_name,tbl_users.last_name,tbl_todo_list.content,DATE_FORMAT(tbl_todo_list.creation,'%Y-%m-%d %H:%i') AS creation FROM tbl_users LEFT JOIN tbl_todo_list ON tbl_todo_list.user_id = tbl_users.id";
  mysqlConnection.getConnection((err, connection) => {
    connection.query(sqlGetTasks, (errors, results, fields) => {
      res.render("admin/index", {
        title: global.__("home"),
        list: results
      });
    });
  });
});

router.get("/settings", (req, res) => {
  if (req.session.user === undefined || req.session.user.userType != "2") {
    res.redirect("/login");
    //res.send("401 Authorization Error");
    return;
  }
  res.render("admin/settings", {
    title: global.__("settings"),
    settings: global.defaultConfig
  });
});
router.post("/settings", (req, res) => {
  if (req.session.user === undefined || req.session.user.userType != "2") {
    res.redirect("/login");
    //res.send("401 Authorization Error");
    return;
  }
  const isSecured = req.body.isSecured;
  const sqlGetTasks =
    "update tbl_config set value = ? where name = 'isSecured';";
  mysqlConnection.getConnection((err, connection) => {
    connection.query(sqlGetTasks, [isSecured], (errors, results, fields) => {
      global.defaultConfig.isSecured = isSecured;
      connection.release();
      //res.status(200).end();
    });
  });

  res.render("admin/settings", {
    title: global.__("settings"),
    settings: global.defaultConfig
  });
});

module.exports = router;
