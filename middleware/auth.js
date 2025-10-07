const jwt = require('jsonwebtoken');

// For Super Admin (if needed)
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// For Restaurant Admin
// const verifyRestaurant = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   if (!token) return res.status(401).json({ error: 'No token provided.' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decoded.restaurantId) {
//       return res.status(400).json({ error: 'Invalid token. Restaurant ID missing.' });
//     }

//     req.restaurantId = decoded.restaurantId;
//     next();
//   } catch (err) {
//     res.status(400).json({ error: 'Invalid token.' });
//   }
// };

const verifyRestaurant = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log('Decoded token:', decoded);

    // ✅ Check for either id or restaurantId
    const restaurantId = decoded.restaurantId || decoded.id;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Invalid token. Restaurant ID missing.' });
    }

    req.restaurantId = decoded.restaurantId;
    next();
  } catch (err) {
    //console.log('JWT verification error:', err.message);
    res.status(400).json({ error: 'Invalid token.' });
  }
};  

module.exports = {
  auth,
  verifyRestaurant
};
