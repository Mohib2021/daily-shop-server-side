const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const fileUpload = require("express-fileupload");

// middleware
app.use(cors());
app.use(fileUpload());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const uri = `mongodb+srv://${process.env.ADMIN_NAME}:${process.env.ADMIN_PASSWORD}@cluster0.nr9ns.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const run = async () => {
	try {
		// connecting with mongodb database
		await client.connect();
		const database = client.db("daily-shop");
		const productsCollections = database.collection("products");
		const usersCollections = database.collection("users");

		// Get all products
		app.get("/products", async (req, res) => {
			const query = productsCollections.find({});
			const result = await query.toArray();
			res.send(result);
		});

		// Get single product
		app.get("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await productsCollections.findOne(query);
			res.send(result);
		});

		//Delete single product
		app.delete("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await productsCollections.deleteOne(query);
			res.json(result);
		});

		// Upload product
		app.post("/products", async (req, res) => {
			const product = req.body;
			const file = req.files;
			const photoData = file.photo.data;
			const encodedPhoto = photoData.toString("base64");
			const photoBuffer = Buffer.from(encodedPhoto, "base64");
			const newProduct = {
				title: product.title,
				img: photoBuffer,
				price: product.price,
				desc: product.desc,
				category: product.category,
			};
			const result = await productsCollections.insertOne(newProduct);
			res.json(result);
		});

		//Get User Collections
		app.get("/users", async (req, res) => {
			const cursor = usersCollections.find({});
			const result = await cursor.toArray();
			res.send(result);
		});

		// Upload User to database
		app.post("/users", async (req, res) => {
			const user = req.body;
			const file = req.files;
			if (!file) {
				// if user login with google
				const query = { email: user.email };
				const existingUser = usersCollections.findOne(query);
				if (!existingUser) {
					const result = usersCollections.insertOne(user);
					res.json(result);
				}
			} else {
				// if user signUp with form manually
				const { displayName, email, role } = user;
				const photoData = file.photo.data;
				const encodedPhoto = photoData.toString("base64");
				const photoBuffer = Buffer.from(encodedPhoto, "base64");
				const newUser = {
					displayName,
					email,
					role,
					photo: photoBuffer,
				};
				const result = usersCollections.insertOne(newUser);
				res.json(result);
			}
		});
	} finally {
		// await client.close()
	}
};
run().catch(console.dir());

app.get("/", (req, res) => {
	res.send("Daily Shop is running");
});
app.listen(port, () => {
	console.log("Server is running in ", port, uri);
});
