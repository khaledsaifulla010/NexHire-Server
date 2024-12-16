const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middlewares //

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nexhire-8ec30.web.app",
      "https://nexhire-8ec30.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// VERIFY TOKEN //

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unothorized User Access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unothorized User Access" });
    }
    req.user = decoded;
    next();
  });
};

// MONGO BD CONNECTION //

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ugbxhsw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // AUTH RELATED APIS //

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    const HotJobsCollection = client.db("NexHire").collection("HotJobs");

    // GET ALL HOT JOBS //

    app.get("/hotJobs", async (req, res) => {
      const cursor = HotJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET A SINGLE HOT JOB //

    app.get("/hotJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await HotJobsCollection.findOne(query);
      res.send(result);
    });

    // GET ALL DATA USING USER INDIBIDUALLY EMAIL //

    app.get("/job_application", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };

      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const result = await jobApplicationCollection.find(query).toArray();

      // Not Best Way //

      for (const application of result) {
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await HotJobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
        }
      }

      res.send(result);
    });

    // GET ALL JOBS //

    app.get("/allJobs", async (req, res) => {
      const result = await AllJobsCollection.find().toArray();
      res.send(result);
    });
    // GET ALL JOBS OF INDIBIDAL RECRUITER //

    app.get("/allJobsOfRecruiter", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = AllJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET A JOB DETAILS //
    app.get("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await AllJobsCollection.findOne(query);
      res.send(result);
    });

    // GET ALL JOBS DATA USING USER INDIBIDUALLY EMAIL //
    app.get("/job_application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicationCollection.find(query).toArray();

      for (const apply of result) {
        const query2 = { _id: new ObjectId(apply.job_id) };
        const newJob = await AllJobsCollection.findOne(query2);

        if (newJob) {
          apply.title = newJob.title;
          apply.company = newJob.company;
          apply.company_logo = apply.company_logo;
        }
      }
      res.send(result);
    });

    // GET ALL JOB APPLICANTS DATA //

    app.get("/job_application/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobApplicationCollection.find(query).toArray();

      res.send(result);
    });

    // GET ALL BLOGS DATA //
    const BlogsCollection = client.db("NexHire").collection("Blogs");

    app.get("/blogs", async (req, res) => {
      const result = await BlogsCollection.find().toArray();
      res.send(result);
    });

    // GET ALL TOP RECRUITER COMPANY DATA //

    const TopRecruiterCompanyCollection = client
      .db("NexHire")
      .collection("TopRecruiterCompany");

    app.get("/topRecruiterCompany", async (req, res) => {
      const result = await TopRecruiterCompanyCollection.find().toArray();
      res.send(result);
    });

    // POST A JOB APPLICATION //

    const jobApplicationCollection = client
      .db("NexHire")
      .collection("JobApplication");

    app.post("/job_applications", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);

      //NOT THE BEST WAY (USE AGGREGATE) //

      const id = application.job_id;
      const query = { _id: new ObjectId(id) };

      const job = await AllJobsCollection.findOne(query);

      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }

      // now update the job info

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updatedResult = await AllJobsCollection.updateOne(
        filter,
        updatedDoc
      );

      res.send(result);
    });

    // POST A JOB FROM REQRUITER OR ADMIN //
    const AllJobsCollection = client.db("NexHire").collection("AllJobs");

    app.post("/allJobs", async (req, res) => {
      const newJob = req.body;
      const result = await AllJobsCollection.insertOne(newJob);
      res.send(result);
    });

    // POST STATUS OF JOBS //

    app.patch("/job_application/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

// Server Running //

app.get("/", (req, res) => {
  res.send("NexHire Server is Running");
});

app.listen(port, () => {
  console.log(`NexHire Server is Running on ${port}`);
});
