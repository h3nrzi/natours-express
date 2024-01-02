const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tour-model');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_CLOUD.replace('<PASSWORD>', process.env.DATABASE_CLOUD_PASSWORD);
// const DB = process.env.DATABASE_LOCAL;
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	})
	.then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// IMPORT DATA INTO DATA DB
const importData = async () => {
	try {
		await Tour.create(tours);
		console.log('Data successfully loaded!');
		process.exit();
	} catch (err) {
		console.log(err);
	}
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
	try {
		await Tour.deleteMany();
		console.log('Data successfully deleted!');
		process.exit();
	} catch (err) {
		console.log(err);
	}
};

if (process.argv[2] === '--import') {
	importData();
}
if (process.argv[2] === '--delete') {
	deleteData();
}