const express = require("express"),
  form = require("express-form"),
  field = form.field,
  csurf = require("csurf"),
  router = express.Router();

router.use(csurf());

router.all("*", (req, res, next) => {
  res.app.locals.layout = "home/index";

  if (req.session.user === undefined) {
    req.session.user = {};
    req.session.user.email = "NONE";
    req.session.user.firstName = "NONE";
    req.session.user.lastName = "NONE";
    req.session.user.userType = "0";
  }
  res.locals.isLoggedIn = (
    req.session.user.userType.toString() != "0"
  ).toString();
  res.locals.isAdmin = (req.session.user.userType == 2).toString();
  res.locals.email = req.session.user.email;
  res.locals.firstName = req.session.user.firstName;
  res.locals.lastName = req.session.user.lastName;

  next();
});

router.get("/", (req, res) => {
  res.render("home/index", {
    title: global.__("home")
  });
});
router.get("/mytodo", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.userType == "1" || req.session.user.userType == "2")
  ) {
    const sqlAddTask =
      "select content,date_format(creation,'%Y-%m-%d %H:%i %p') as `creation` from tbl_todo_list where user_id = ? order by creation desc;";
    mysqlConnection.getConnection((err, connection) => {
      connection.query(
        sqlAddTask,
        [req.session.user.id],
        (errors, results, field) => {
          if (errors) {
            res.render("home/mytodo", {
              title: global.__("mytodo"),
              error_add_task: "database error."
            });
            console.log(errors);
            connection.release();
            return;
          }
          connection.release();
          res.render("home/mytodo", {
            title: global.__("mytodo"),
            list: results
          });
        }
      );
    });
  } else {
    res.redirect("/login");
  }
});
router.get("/login", (req, res) => {
  res.render("home/login", {
    title: global.__("login"),
    csrf: req.csrfToken()
  });
});
router.post(
  "/login",
  form(
    field("txtEmail")
      .trim()
      .required()
      .isEmail(),
    field("txtPassword")
      .trim()
      .required()
  ),
  (req, res) => {
    if (req.form.isValid || global.defaultConfig.isSecured != "true") {
      mysqlConnection.getConnection((err, connection) => {
        var sqlLogin = "";
        if (global.defaultConfig.isSecured == "true") {
          sqlLogin = "select * from tbl_users where email = ? and password = ?";
        } else {
          console.log("2");
          sqlLogin =
            "select * from tbl_users where email = '" +
            req.body.txtEmail +
            "' and password = '" +
            req.body.txtPassword +
            "'";
        }
        connection.query(
          sqlLogin,
          [req.body.txtEmail, req.body.txtPassword],
          (errors, results, fields) => {
            if (errors) {
              res.render("home/login", {
                title: global.__("login"),
                error: errors
              });
              connection.release();
              return;
            }
            if (results.length == 0) {
              res.render("home/login", {
                title: global.__("login"),
                error: "Email Or Password is wrong"
              });
              connection.release();
              return;
            }
            req.session.user = {};
            req.session.user.id = results[0].id;
            req.session.user.email = results[0].email;
            req.session.user.firstName = results[0].first_name;
            req.session.user.lastName = results[0].last_name;
            req.session.user.userType = results[0].user_type;
            connection.release();
            res.redirect("/mytodo");
          }
        );
      });
    } else {
      res.render("home/login", {
        title: global.__("login"),
        error: req.form.errors
      });
    }
  }
);
router.get("/register", (req, res) => {
  res.render("home/register", {
    title: global.__("register"),
    csrf: req.csrfToken()
  });
});
router.post(
  "/register",
  form(
    field("txtFirstName")
      .trim()
      .required()
      .is("([A-Za-z\u0621-\u064A0-9. -]+)"),
    field("txtLastName")
      .trim()
      .required()
      .is("([A-Za-z\u0621-\u064A0-9. -]+)"),
    field("txtEmail")
      .trim()
      .required()
      .isEmail(),
    field("txtPassword")
      .trim()
      .required(),
    field("txtPasswordConfirmation")
      .trim()
      .required()
      .equals("field::txtPassword")
  ),
  (req, res) => {
    if (req.form.isValid || global.defaultConfig.isSecured != "true") {
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
          res.render("home/register", {
            title: global.__("register"),
            error: err
          });
        }
        var sqlAddNewClient;
        if (global.defaultConfig.isSecured == "true") {
          sqlAddNewClient =
            "INSERT INTO tbl_users (email,`password`,first_name,last_name,user_type) VALUE (?,?,?,?,1);";
        } else {
          sqlAddNewClient =
            "INSERT INTO tbl_users (email,`password`,first_name,last_name,user_type) VALUE ('" +
            req.body.txtEmail +
            "','" +
            req.body.txtPassword +
            "','" +
            req.body.txtFirstName +
            "','" +
            req.body.txtLastName +
            "',1);";
        }

        connection.query(
          sqlAddNewClient,
          [
            req.body.txtEmail,
            req.body.txtPassword,
            req.body.txtFirstName,
            req.body.txtLastName
          ],
          (errors, results, fields) => {
            if (errors) {
              res.render("home/register", {
                title: global.__("register"),
                error: "Email is already existed"
              });
              console.log(errors);
              connection.release();
              return;
            }
            const sqlGetUser =
              "select * from tbl_users where email = ? and password = ?";
            connection.query(
              sqlGetUser,
              [req.body.txtEmail, req.body.txtPassword],
              (errors, results, fields) => {
                if (errors) {
                  res.render("home/register", {
                    title: global.__("register"),
                    error: "login error"
                  });
                  console.log(errors);
                  connection.release();
                  return;
                }
                req.session.user = {};
                req.session.user.id = results[0].id;
                req.session.user.email = req.body.txtEmail;
                req.session.user.firstName = req.body.txtFirstName;
                req.session.user.lastName = req.body.txtLastName;
                req.session.user.userType = 1;
                connection.release();
                res.redirect("/mytodo");
              }
            );
          }
        );
      });
    } else {
      res.render("home/register", {
        title: global.__("register"),
        error: req.form.errors
      });
    }
  }
);
router.get("/profile", (req, res) => {
  res.render("home/profile", {
    title: global.__("profile")
  });
});
router.get("/logout", (req, res) => {
  //Logging out
  req.session.user = {};
  req.session.user.email = "NONE";
  req.session.user.firstName = "NONE";
  req.session.user.lastName = "NONE";
  req.session.user.userType = "0";

  res.locals.isLoggedIn = false.toString();
  res.locals.isAdmin = false.toString();
  res.locals.email = "NONE";
  res.locals.firstName = "NONE";
  res.locals.lastName = "NONE";
  res.render("home/index", {
    title: global.__("home")
  });
});
router.post(
  "/addTask",
  form(
    field("txtTask")
      .trim()
      .required()
      .is("([A-Za-z\u0621-\u064A0-9. -]+)")
  ),
  (req, res) => {
    if (req.form.isValid || global.defaultConfig.isSecured != "true") {
      var sqlAddTask;
      if (global.defaultConfig.isSecured == "true") {
        sqlAddTask = "insert into tbl_todo_list (user_id,content) value (?,?);";
      } else {
        sqlAddTask =
          "insert into tbl_todo_list (user_id,content) value ('" +
          req.session.user.id +
          "','" +
          req.body.txtTask +
          "');";
      }

      mysqlConnection.getConnection((err, connection) => {
        connection.query(
          sqlAddTask,
          [req.session.user.id, req.body.txtTask],
          (errors, results, field) => {
            if (errors) {
              res.render("home/mytodo", {
                title: global.__("mytodo"),
                error_add_task: "insertion errors"
              });
              console.log(errors);
              connection.release();
              return;
            }
            var sqlGetTasks;
            if (global.defaultConfig.isSecured == "true") {
              sqlGetTasks =
                "select content,date_format(creation,'%Y-%m-%d %H:%i %p') as `creation` from tbl_todo_list  where user_id = ? order by creation desc;";
            } else {
              sqlGetTasks =
                "select content,date_format(creation,'%Y-%m-%d %H:%i %p') as `creation` from tbl_todo_list  where user_id = '" +
                req.session.user.id +
                "' order by creation desc;";
            }

            connection.query(
              sqlGetTasks,
              [req.session.user.id],
              (errors, results, fields) => {
                if (errors) {
                  res.render("home/mytodo", {
                    title: global.__("mytodo"),
                    error_add_task: "Gettings tasks errors"
                  });
                  console.log(errors);
                  connection.release();
                  return;
                }
                connection.release();

                res.render("home/mytodo", {
                  title: global.__("mytodo"),
                  taskAdded: global.__("taskAdded"),
                  list: results
                });
              }
            );
          }
        );
      });
    } else {
      res.render("home/mytodo", {
        title: global.__("mytodo"),
        error_add_task: req.form.errors
      });
    }
  }
);
router.post(
  "/tasks/search",
  form(
    field("txtSearch")
      .trim()
      .is("([A-Za-z\u0621-\u064A0-9. -]+)")
  ),
  (req, res) => {
    if (req.form.isValid || global.defaultConfig.isSecured != "true") {
      mysqlConnection.getConnection((err, connection) => {
        var sqlSearch;
        if (global.defaultConfig.isSecured == "true") {
          sqlSearch = `select content,date_format(creation,'%Y-%m-%d %H:%i %p') as \`creation\` from tbl_todo_list where user_id = ? and content like ${connection.escape(
            "%" + req.body.txtSearch + "%"
          )} order by creation desc;`;
        } else {
          sqlSearch = `select content,date_format(creation,'%Y-%m-%d %H:%i %p') as \`creation\` from tbl_todo_list where user_id = ${
            req.session.user.id
          } and content like ${"%" +
            req.body.txtSearch +
            "%"} order by creation desc;`;
        }

        connection.query(
          sqlSearch,
          [req.session.user.id],
          (errors, results, fields) => {
            if (errors) {
              res.render("home/mytodo", {
                title: global.__("mytodo"),
                error: "Database Querying Error"
              });
              console.log(errors);
              connection.release();
              return;
            }
            res.render("home/mytodo", {
              title: global.__("mytodo"),
              list: results,
              search: req.body.txtSearch
            });
            connection.release();
          }
        );
      });
    } else {
    }
  }
);
module.exports = router;
