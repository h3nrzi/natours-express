const Tour = require('../models/tour-model');
const APIFeatures = require('../utils/api-features');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = parseInt(req.params.year);

	const plan = await Tour.aggregate([
		{
			$unwind: '$startDates'
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`)
				}
			}
		},
		{
			$group: {
				_id: { $month: '$startDates' },
				numToursStarts: { $sum: 1 },
				tours: { $push: '$name' }
			}
		},
		{
			$addFields: {
				month: '$_id'
			}
		},
		{
			$project: {
				_id: 0
			}
		},
		{
			$sort: {
				numToursStarts: -1
			}
		},
		{
			$limit: 6
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			plan: plan
		}
	});
});

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: {
				ratingsAverage: { $gte: 4.5 }
			}
		},
		{
			$group: {
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			$sort: {
				minPrice: 1
			}
		}
		/*
			{
				$match: {
					_id: { $ne: 'EASY' }
				}
			}
		*/
	]);

	res.status(200).json({
		status: 'success',
		data: {
			stats: stats
		}
	});
});

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
	const features = new APIFeatures(Tour.find(), req.query);

	features
		.filter()
		.sort()
		.limitFelids()
		.pagination();

	const tours = await features.query;

	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			tours: tours
		}
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findById(req.params.id);
	if (!tour) return next(new AppError('No tour found with that ID.', 404));

	res.status(200).json({
		status: 'success',
		data: {
			tour: tour
		}
	});
});

exports.createTour = catchAsync(async (req, res, next) => {
	const newTour = await Tour.create(req.body);

	res.status(201).json({
		status: 'success',
		data: {
			tour: newTour
		}
	});
});

exports.updateTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true
	});
	if (!tour) return next(new AppError('No tour found with that ID.', 404));

	res.status(200).json({
		status: 'success',
		data: {
			tour: tour
		}
	});
});

exports.deleteTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findByIdAndDelete(req.params.id);
	if (!tour) return next(new AppError('No tour found with that ID.', 404));

	res.status(204).json({
		status: 'success',
		data: {
			tour: null
		}
	});
});
