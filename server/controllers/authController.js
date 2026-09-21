const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function signup(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword });

    return res.status(201).json({
      message: 'Account created successfully',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Unable to create account' });
  }
}

async function login(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to log in' });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Current user error:', error);
    return res.status(500).json({ message: 'Unable to load user' });
  }
}

module.exports = { signup, login, getCurrentUser };
