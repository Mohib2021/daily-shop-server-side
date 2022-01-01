const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient } = require("mongodb");
require("dotenv").config();

// middleware
app.use(cors());

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
		const products = database.collection("products");

		// Get all products
		app.get("/products", async (req, res) => {
			const query = products.find({});
			const result = await query.toArray();
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
