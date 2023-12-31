const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
	console.log('Hello from the middleware👋🏻');
	next();
});

app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	next();
});

const port = 3000;

const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

const getAllTours = (req, res) => {
	console.log(req.requestTime);

	res.status(200).json({
		status: 'success',
		requestedAt: req.requestTime,
		results: tours.length,
		data: {
			tours: tours
		}
	});
};

const getTour = (req, res) => {
	// console.log(req.params);
	// console.log(parseInt(req.params.id));

	const id = parseInt(req.params.id);
	const tour = tours.find((tour) => tour.id === id);

	// if (id >= tours.length) {
	if (!tour) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID.'
		});
	}

	res.status(200).json({
		status: 'success',
		data: {
			tour: tour
		}
	});
};

const createTour = (req, res) => {
	// console.log(req.body);

	const newId = tours[tours.length - 1].id + 1;
	const newTour = Object.assign({ id: newId }, req.body);

	tours.push(newTour);
	fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
		res.status(201).json({
			status: 'success',
			data: {
				tour: newTour
			}
		});
	});
};

const updateTour = (req, res) => {
	const id = parseInt(req.params.id);
	if (id >= tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID.'
		});
	}

	res.status(200).json({
		status: 'success',
		data: {
			tour: 'Updated tour'
		}
	});
};

const deleteTour = (req, res) => {
	const id = parseInt(req.params.id);
	if (id >= tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID.'
		});
	}

	res.status(204).json({
		status: 'success',
		data: null
	});
};

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app
	//
	.route('/api/v1/tours')
	.get(getAllTours)
	.post(createTour);

app
	//
	.route('/api/v1/tours/:id')
	.get(getTour)
	.patch(updateTour)
	.delete(deleteTour);

app.listen(port, () => {
	console.log(`App running on ${port}...`);
});
