//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import _ from "lodash";
import env from "dotenv";

const homeStartingContent = "At Productivity Hub, we’re passionate about helping teams and individuals maximize their productivity and streamline their workflows. Our blog is your go-to resource for the latest updates, tips, and insights on how to get the most out of our app. Whether you’re a seasoned project manager, a startup founder, or anyone in between, you’ll find valuable information and inspiration here.";
const aboutContent = "At Productivity Hub, we're driven by a singular mission: to empower individuals and teams to achieve their highest levels of productivity and efficiency. Our journey began with a simple belief – that the right tools can transform the way we work, unleashing our full potential and enabling us to accomplish more than we ever thought possible. A Commitment to ExcellenceFrom our inception, we've been committed to excellence in every aspect of our web app. We strive to deliver a seamless user experience that simplifies complex workflows and enhances collaboration. Every feature, every design element, and every line of code is crafted with one goal in mind – to make your life easier and your work more productive. Putting Users First At the heart of Productivity Hub is a deep understanding of our users' needs and challenges. We believe that the best solutions are born from listening – listening to your feedback, your frustrations, and your aspirations. That's why we're constantly engaging with our user community, gathering insights, and refining our app to better serve you. Innovation at the Core Innovation is in our DNA. We're not content with the status quo – we're always pushing the boundaries, exploring new technologies, and seeking out fresh ideas to stay ahead of the curve. Whether it's integrating AI and Machine Learning, embracing the latest design trends, or adopting new development methodologies, we're relentless in our pursuit of innovation. Empowering Collaboration We believe that collaboration is the key to success in any endeavor. That's why Productivity Hub is built from the ground up to facilitate seamless collaboration among team members, no matter where they are. Whether you're working on a small project with a handful of colleagues or managing a large-scale initiative with distributed teams, our app provides the tools you need to communicate, coordinate, and collaborate effectively.A Platform for Growth Our vision extends beyond just helping you manage your tasks – we're here to help you grow and thrive in your personal and professional life. That's why [Your Web App Name] is designed to be more than just a productivity tool – it's a platform for learning, development, and personal growth. Through our blog, tutorials, and educational resources, we're here to support you on your journey to success.";
const contactContent = "We’re here to support you on your journey to greater productivity and efficiency. Whether you have questions, feedback, or need assistance, our team is ready to help. Get in touch with us using the following options:";
env.config();

const app = express();
const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const database = await db.query("SELECT * FROM blogweb");
    res.render("home.ejs", {
      home: homeStartingContent,
      storage: database.rows
    });
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/about", (req, res) => {
  res.render("about.ejs", {
    about: aboutContent
  });
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs", {
    contact: contactContent
  });
});

app.get("/compose", (req, res) => {
  res.render("compose.ejs");
});

app.post("/submit", async (req, res) => {
  const postTitle = req.body["posttitle"];
  const postContent = req.body["posttext"];
  try {
    await db.query(
      "INSERT INTO blogweb (title, content) VALUES($1,$2)",
      [postTitle, postContent]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/post/:postID", async (req, res) => {
  // const requestTitle = _.lowerCase(req.params.postName);
  const id = Number.parseInt(req.params.postID);
  try {
    const database = await db.query("SELECT * FROM blogweb WHERE blogweb.id = $1",
      [id]);
    if (database.rows.length === 0) {
      return res.status(404).send("Blog not found");
    } else {
      res.render("post.ejs", {
        post: database.rows[0],
      });
    }
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/edit/:postID", async (req, res) => {
  // const editTitle = _.lowerCase(req.params.postName);
  const id = Number.parseInt(req.params.postID);

  try {
    const database = await db.query("SELECT * FROM blogweb WHERE blogweb.id = $1",
      [id]);
    if (database.rows.length === 0) {
      return res.status(404).send("Can't access.");
    } else {
      res.render("edit.ejs", {
        post: database.rows[0],
      });
    }
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/update/:id", async (req, res) => {
  let id = req.params.id;
  let postTitle = req.body["posttitle"];
  let postContent = req.body["posttext"];

  try {
    const database = await db.query(
      "UPDATE blogweb SET title = $1 , content = $2 WHERE blogweb.id = $3 RETURNING *",
      [postTitle, postContent, id]);
    console.log(database.rows);
    if (database.rows.length === 0) {
      return res.status(404).send("Title and Content not updated.");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/confirm-delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // Fetch the post from the database
    const database = await db.query(
      "SELECT * FROM blogweb WHERE blogweb.id = $1;",
      [id]
    );
    if (database.rows.length === 0) {
      return res.status(404).send("Post not found.");
    } else {
      // Render the delete confirmation page with post data
      res.render("deleteConfirmation.ejs", {
        post: database.rows[0]
      });
    }
  } catch (error) {
    console.error("Failed to fetch post:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const database = await db.query(
      "DELETE FROM blogweb WHERE blogweb.id = $1 RETURNING *;",
      [id]);
    console.log(database.rows[0]);
    if (database.rows.length === 0) {
      return res.status(404).send("Not deleted.");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Failed to fetch books:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
