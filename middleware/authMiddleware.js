// Authentication Middleware

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  // Store the original URL for redirect after login
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/login");
};

// Check if user has required role
// Roles: 0 = admin, 1 = staff, 2 = user
const hasRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.session.returnTo = req.originalUrl;
      return res.redirect("/auth/login");
    }

    const userRole = req.session.user.role;

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // User doesn't have permission
    res.status(403).render("error", {
      message: "Bạn không có quyền truy cập trang này",
      error: { status: 403 },
    });
  };
};

// Check if user is admin
const isAdmin = hasRole([0]);

// Check if user is staff or admin
const isStaff = hasRole([0, 1]);

// Make user available in all views
const setUserLocals = (req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.isAdmin =
    req.session && req.session.user && req.session.user.role === 0;
  res.locals.isStaff =
    req.session && req.session.user && req.session.user.role <= 1;
  next();
};

module.exports = {
  isAuthenticated,
  hasRole,
  isAdmin,
  isStaff,
  setUserLocals,
};
