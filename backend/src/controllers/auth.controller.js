import User from '../models/user.model.js';
import { generateToken } from '../lib/utils.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    const { email, name, surname, password } = req.body;
    try {
        if (!email || !name || !surname || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Validate input
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            name,
            surname,
            password: hashedPassword,
        });

        if (newUser) {
            // generate JWT token
            generateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({
                message: 'User created successfully',
                user: {
                    email: newUser.email,
                    name: newUser.name,
                    surname: newUser.surname
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }

    }
    catch (error) {
        console.log('Error during signup:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // generate JWT token
        generateToken(user._id, res);
        return res.status(200).json({
            message: 'Login successful',
            user: {
                email: user.email,
                name: user.name,
                surname: user.surname
            }
        });
    }
    catch (error) {
        console.log('Error during login:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', { maxAge: 0 });
        return res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
        console.log('Error during logout:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture } = req.body;
        const userId = req.user._id;

        if (!profilePicture) {
            return res.status(400).json({ message: 'Profile picture is required' });
        }

        const result = await cloudinary.uploader.upload(profilePicture);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: result.secure_url },
            { new: true }
        );

        res.status(200).json({ message: 'Profile picture updated successfully', user: updatedUser });

    } catch (error) {
        console.error('Error uploading profile picture:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    }
    catch (error) {
        console.error('Error checking authentication:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}