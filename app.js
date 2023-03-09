const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const { MongoClient, ObjectId } = require("mongodb");

const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 3000;

// Setup method override
app.use(methodOverride("_method"));

// Setup EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// ---------------- v1 (mongoDB native) ----------------------------
MongoClient.connect(
  "mongodb+srv://dede:ananiu12@cluster0.qiqgntv.mongodb.net/?retryWrites=true&w=majority"
)
  .then((client) => {
    console.log("Conected to MongoDB");
    const db = client.db("myContact");
    const Contact = db.collection("contacts");

    // Halaman Home
    app.get("/v1/", (req, res) => {
      const mahasiswa = [
        {
          nama: "Dede Nurdiyanto",
          email: "dedenurdiyanto@gmail.com",
        },
        {
          nama: "Ronaldo",
          email: "ronaldo@gmail.com",
        },
        {
          nama: "Messi",
          email: "messi@gmail.com",
        },
      ];
      res.render("index", {
        nama: "Dede Nurdiyanto",
        title: "Home Page",
        mahasiswa,
        layout: "layouts1/main-layout",
      });
    });

    // Halaman About
    app.get("/v1/about", (req, res) => {
      res.render("about1", {
        layout: "layouts1/main-layout",
        title: "About Page",
      });
    });

    // Halaman Contact
    app.get("/v1/contact", async (req, res) => {
      const contacts = await Contact.find({}).toArray();

      res.render("contact1", {
        layout: "layouts1/main-layout",
        title: "Contact Page",
        contacts,
        msg: req.flash("msg"),
      });
    });

    // halaman form tambah contact
    app.get("/v1/contact/add", (req, res) => {
      res.render("add-contact1", {
        title: "Form Tambah Contact",
        layout: "layouts1/main-layout",
      });
    });

    // proses tambah data contact
    app.post(
      "/v1/contact",
      [
        body("nama").custom(async (value) => {
          const duplikat = await Contact.findOne({ nama: value });
          if (duplikat) {
            throw new Error("Nama contact sudah digunakan!");
          }
          return true;
        }),
        check("email", "Email tidak valid!").isEmail(),
        check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
      ],
      (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.render("add-contact1", {
            title: "Form Tambah Contact",
            layout: "layouts1/main-layout",
            errors: errors.array(),
          });
        } else {
          Contact.insertOne(req.body);

          req.flash("msg", "Contact berhasil ditambahkan!");
          res.redirect("/v1/contact");
        }
      }
    );

    app.delete("/v1/contact", (req, res) => {
      Contact.deleteOne({ nama: req.body.nama }).then((result) => {
        req.flash("msg", "Contact berhasil dihapus!");
        res.redirect("/v1/contact");
      });
    });

    // form ubah contact
    app.get("/v1/contact/edit/:nama", async (req, res) => {
      const contact = await Contact.findOne({ nama: req.params.nama });

      res.render("edit-contact1", {
        title: "Form Ubah Contact",
        layout: "layouts1/main-layout",
        contact,
      });
    });

    // proses ubah data
    app.put(
      "/v1/contact",
      [
        body("nama").custom(async (value, { req }) => {
          const duplikat = await Contact.findOne({ nama: value });
          if (value !== req.body.oldNama && duplikat) {
            throw new Error("Nama contact sudah digunakan!");
          }

          return true;
        }),

        check("email", "Email tidak valid!").isEmail(),
        check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
      ],
      (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          // return res.status(400).json({ errors: errors.array() });
          res.render("edit-contact1", {
            title: "Form Edit Contact",
            layout: "layouts1/main-layout",
            errors: errors.array(),
            contact: req.body,
          });
        } else {
          Contact.updateOne(
            { _id: new ObjectId(req.body._id) },
            {
              $set: {
                nama: req.body.nama,
                email: req.body.email,
                nohp: req.body.nohp,
              },
            }
          ).then((results) => {
            req.flash("msg", "Contact berhasil diubah!");
            res.redirect("/v1/contact");
          });
        }
      }
    );

    // halaman detail contact
    app.get("/v1/contact/:nama", async (req, res) => {
      const contact = await Contact.findOne({ nama: req.params.nama });

      res.render("detail1", {
        layout: "layouts1/main-layout",
        title: "Detail Contact Page",
        contact,
      });
    });

    // app.listen(port, () => {
    //   console.log(`Mongo Contact App | listening at http://localhost:${port}`);
    // });
  })
  .catch((error) => {
    console.log(error.message);
  });

// --------------------- v2 (mongoose) ---------------------------

// Halaman Home
app.get("/v2/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Dede Nurdiyanto",
      email: "dedenurdiyanto@gmail.com",
    },
    {
      nama: "Ronaldo",
      email: "ronaldo@gmail.com",
    },
    {
      nama: "Messi",
      email: "messi@gmail.com",
    },
  ];
  res.render("index", {
    nama: "Dede Nurdiyanto",
    title: "Home Page",
    mahasiswa,
    layout: "layouts2/main-layout",
  });
});

// Halaman About
app.get("/v2/about", (req, res) => {
  res.render("about", {
    layout: "layouts2/main-layout",
    title: "About Page",
  });
});

// Halaman Contact
app.get("/v2/contact", async (req, res) => {
  const contacts = await Contact.find();

  res.render("contact", {
    layout: "layouts2/main-layout",
    title: "Contact Page",
    contacts,
    msg: req.flash("msg"),
  });
});

// halaman form tambah contact
app.get("/v2/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Form Tambah Contact",
    layout: "layouts2/main-layout",
  });
});

// proses tambah data contact
app.post(
  "/v2/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error("Nama contact sudah digunakan!");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form Tambah Contact",
        layout: "layouts2/main-layout",
        errors: errors.array(),
      });
    } else {
      Contact.insertMany(req.body, (error, result) => {
        // kirimkan flash message
        req.flash("msg", "Contact berhasil ditambahkan!");
        res.redirect("/v2/contact");
      });
    }
  }
);

app.delete("/v2/contact", (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash("msg", "Contact berhasil dihapus!");
    res.redirect("/v2/contact");
  });
});

// form ubah contact
app.get("/v2/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("edit-contact", {
    title: "Form Ubah Contact",
    layout: "layouts2/main-layout",
    contact,
  });
});

// proses ubah data
app.put(
  "/v2/contact",
  [
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama contact sudah digunakan!");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render("edit-contact", {
        title: "Form Edit Contact",
        layout: "layouts2/main-layout",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      ).then((result) => {
        // kirimkan flash message
        req.flash("msg", "Contact berhasil diubah!");
        res.redirect("/v2/contact");
      });
    }
  }
);

// halaman detail contact
app.get("/v2/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("detail", {
    layout: "layouts2/main-layout",
    title: "Detail Contact Page",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}/v1/`);
});
