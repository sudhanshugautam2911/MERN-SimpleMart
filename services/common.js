const passport = require("passport");

exports.isAuth = (req, res, done) => {
    return passport.authenticate('jwt')
};

exports.sanitizeUser = (user) => {
    return {id: user.id, role:user.role}
}

exports.cookieExtractor = function(req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    // TODO: temporary for testing
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NGYwNjhjYmU3NDNmNTAyMzk3NzExZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk5Njc3ODQ3fQ.zOdLrDq0iLK9dxWmcC05F95Rz6N6UeX4dqCfwarmckI"
    return token;
};