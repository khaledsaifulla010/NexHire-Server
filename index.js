const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middlewares //

app.use(cors());
app.use(express.json());

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

    // POST A JOB APPLICATION //

    const jobApplicationCollection = client
      .db("NexHire")
      .collection("JobApplication");

    app.post("/job_application", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
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
