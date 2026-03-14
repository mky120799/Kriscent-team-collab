export const sessionAuth = (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
        console.log('not authorised', req.session);
        return res.status(401).json({ message: "Not authenticated" });
    }
    // Attach the logged-in user to req.user
    req.user = req.session.user;
    next();
};
//# sourceMappingURL=sessionAuth.middleware.js.map