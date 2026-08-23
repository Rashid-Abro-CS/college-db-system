const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 PROTECT - Sirf logged in user ko access dega
exports.protect = async (req, res, next) => {
  let token;
  
  // Token check karo headers mein
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Agar token nahi hai to access deny
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized! Please login first.' 
    });
  }
  
  try {
    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // User find karo (password nahi chahiye)
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, token failed' 
    });
  }
};

// 👑 AUTHORIZE - Sirf specific roles ko access dega
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check karo ke user ka role allowed hai ya nahi
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied! ${req.user.role} role is not allowed to access this route.` 
      });
    }
    next();
  };
};