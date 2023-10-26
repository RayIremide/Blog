const User = require('../Database/Model/User');
const jwt = require('jsonwebtoken');
const logger = require('../logger/index')
require('dotenv').config();

//User service for signup
const Signup = async ({ username,email, password,first_name,last_name }) => {
    logger.info('[UserService] => Signup process started');
    const userFromRequest = { username,email, password,first_name,last_name };

    try {
        const existingUser = await User.userModel.findOne({ email: userFromRequest.email });

        if (existingUser) {
            return {
                message: 'User already exists. Please log in.',
                code: 409
            };
        }

        const newUser = User.userModel.create(userFromRequest);

  
        // Create a JWT token for the new user
        const token = jwt.sign(
            {
                email: newUser.email,
                user_id: newUser._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return {
            message: 'User registered successfully',
            code: 201, 
            data: {
                user: newUser,
                token,
            },
        };
    } catch (error) {
        logger.error('[UserService] => Signup process failed', error);
        return {
            message: 'Registration failed',
            code: 500
        };
    }

}

//User service for log in
const Login = async ({ email, password }) => {
    logger.info('[UseService] => login process started')
    const userFromRequest = { email, password }

    const user = await User.userModel.findOne({
        email: userFromRequest.email,
    });

    if (!user) { 
        return {
            message: 'User not found! Please sign up',
            code: 404
        }
    }


    const passwordMatch = await user.isValidPassword(userFromRequest.password)

    if (!passwordMatch) {
        return {
            message: 'Email or password is not correct',
            code: 401,
        }
    }

    const token = await jwt.sign({ 
        email: user.email, 
        _id: user._id},
        process.env.JWT_SECRET, 
        { expiresIn: '1h' })

        return {
            message: 'Login successful',
            code: 200,
            data: {
                user,
                token
            }
        }
}

module.exports = {
    Login,
    Signup
}