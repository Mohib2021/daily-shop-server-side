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
		const ratingsCollections = database.collection("ratings");
		const ordersCollections = database.collection("orders");
		/* 
-----------------------------
products collections starts from here
-----------------------------*/

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

		/* 
-----------------------------
User collections starts from here
-----------------------------*/

		//Get User Collections
		app.get("/users", async (req, res) => {
			const cursor = usersCollections.find({});
			const result = await cursor.toArray();
			console.log("user collection is hitting");
			res.send(result);
		});

		// Update user role
		app.put("/users/:id", async (req, res) => {
			const id = req.params.id;
			const body = req.body;
			const query = { _id: ObjectId(id) };
			const option = { upsert: true };
			const updateDoc = {
				$set: {
					role: body.role,
				},
			};
			const result = await usersCollections.updateOne(query, updateDoc, option);
			res.json(result);
		});

		// Upload User to database
		app.post("/users", async (req, res) => {
			console.log("user post api is hitting");
			const user = req.body;
			const file = req.files;
			if (!file) {
				// if user login with google
				const query = { email: user.email };
				const existingUser = await usersCollections.findOne(query);
				if (!existingUser) {
					const result = await usersCollections.insertOne(user);
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
				const result = await usersCollections.insertOne(newUser);
				res.json(result);
			}
		});

		/* 
-----------------------------
User collections starts from here
-----------------------------*/

		//Get rating Collections
		app.get("/ratings", async (req, res) => {
			const cursor = ratingsCollections.find({});
			const result = await cursor.toArray();
			res.send(result);
		});

		/* 
-----------------------------
User collections starts from here
-----------------------------*/

		//Get Order Collections
		app.get("/orders", async (req, res) => {
			const cursor = ordersCollections.find({});
			const result = await cursor.toArray();
			res.send(result);
		});

		// Post Order to collection
		app.post("/orders", async (req, res) => {
			const order = req.body;
			const result = await ordersCollections.insertOne(order);
			res.send(result);
		});

		// Update order status to Shipping
		app.put("/orders/:id", async (req, res) => {
			const id = req.params.id;
			const body = req.body;
			const query = { _id: ObjectId(id) };
			const option = { upsert: true };
			let updateDoc;
			if (body.status) {
				updateDoc = {
					$set: {
						status: body.status,
					},
				};
			} else {
				updateDoc = {
					$set: {
						payment: body,
					},
				};
			}
			const result = await ordersCollections.updateOne(
				query,
				updateDoc,
				option
			);
			res.send(result);
		});

		// Delete single Order
		app.delete("/orders/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await ordersCollections.deleteOne(query);
			res.send(result);
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
