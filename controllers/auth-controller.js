const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/app-error');

function signupToken(id) {
	const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
	return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function verifyToken(token) {
	const { JWT_SECRET } = process.env;
	return await promisify(jwt.verify)(token, JWT_SECRET);
}

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		passwordChangedAt: req.body.passwordChangedAt
	});

	const token = signupToken(newUser._id);
	res.status(201).json({
		status: 'success',
		token,
		data: { user: newUser }
	});
});

exports.login = catchAsync(async (req, res, next) => {
	// 1) Check if email and password exist
	const { email, password } = req.body;
	if (!email || !password) return next(new AppError('Please provide email and password!', 400));

	// 2) Check if user exists && password is correct
	const user = await User.findOne({ email: email }).select('+password');
	if (!user || !(await user.comparePasswords(password)))
		return next(new AppError('Incorrect email and password', 401));

	// 3) If everything ok, send token to client
	const token = signupToken(user._id);
	res.status(200).json({
		status: 'success',
		token
	});
});

exports.protect = catchAsync(async (req, res, next) => {
	// 1) Getting token and check of it's there
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}
	if (!token) return next(new AppError('you are not logged in! please log in to get access.', 401));

	// 2) Verification token
	const decodedToken = await verifyToken(token);

	// 3) Check if user still exists
	const currentUser = await User.findById(decodedToken.id);
	if (!currentUser)
		return next(new AppError('The user belonging to this token does no longer exist.', 401));

	// 4) Check if user changed password after the token was issued
	if (currentUser.changedPasswordAfter(decodedToken.iat))
		return next(new AppError('User recently changed password! Please log ing again', 401));

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	next();
});
