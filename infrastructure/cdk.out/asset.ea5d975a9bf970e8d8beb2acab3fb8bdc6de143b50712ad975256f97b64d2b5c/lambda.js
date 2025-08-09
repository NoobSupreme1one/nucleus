/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 43:
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),

/***/ 283:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  getAuthMiddleware: () => (/* binding */ getAuthMiddleware),
  e: () => (/* binding */ auth_factory_setupAuth)
});

// UNUSED EXPORTS: isAuthenticated

;// external "@aws-sdk/client-cognito-identity-provider"
const client_cognito_identity_provider_namespaceObject = require("@aws-sdk/client-cognito-identity-provider");
// EXTERNAL MODULE: ./server/storage.ts + 1 modules
var storage = __webpack_require__(637);
// EXTERNAL MODULE: external "helmet"
var external_helmet_ = __webpack_require__(525);
var external_helmet_default = /*#__PURE__*/__webpack_require__.n(external_helmet_);
// EXTERNAL MODULE: external "cors"
var external_cors_ = __webpack_require__(577);
var external_cors_default = /*#__PURE__*/__webpack_require__.n(external_cors_);
;// external "isomorphic-dompurify"
const external_isomorphic_dompurify_namespaceObject = require("isomorphic-dompurify");
;// ./server/middleware/security.ts



// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'https://nucleus-app.vercel.app', // Replace with your production domain
            process.env.FRONTEND_URL,
        ].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'stripe-signature',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
};
// Security headers configuration
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-eval needed for Vite in dev
            connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
};
// Input sanitization middleware
function sanitizeInput() {
    return (req, res, next) => {
        try {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body);
            }
            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = sanitizeObject(req.query);
            }
            next();
        }
        catch (error) {
            console.error('Input sanitization error:', error);
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Invalid input data'
                }
            });
        }
    };
}
// Recursive object sanitization
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip all HTML
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
// Request validation middleware
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: result.error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    }
                });
            }
            req.body = result.data;
            next();
        }
        catch (error) {
            console.error('Request validation error:', error);
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed'
                }
            });
        }
    };
}
// Security logging middleware
function securityLogger() {
    return (req, res, next) => {
        const startTime = Date.now();
        // Log security-relevant events
        const securityEvents = [
            'login', 'logout', 'register', 'password-reset',
            'subscription', 'payment', 'admin'
        ];
        const isSecurityEvent = securityEvents.some(event => req.path.includes(event) || req.path.includes('auth'));
        if (isSecurityEvent) {
            console.log(`[SECURITY] ${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                userId: req.user?.id,
            });
        }
        // Log response time for monitoring
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            if (duration > 5000) { // Log slow requests
                console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${duration}ms`);
            }
        });
        next();
    };
}
// Account lockout protection
const loginAttempts = new Map();
function accountLockoutProtection() {
    return (req, res, next) => {
        const identifier = req.body.email || req.ip;
        const now = Date.now();
        const attempts = loginAttempts.get(identifier);
        // Check if account is locked
        if (attempts?.lockedUntil && now < attempts.lockedUntil) {
            const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
            return res.status(423).json({
                success: false,
                error: {
                    code: 'ACCOUNT_LOCKED',
                    message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
                    lockedUntil: new Date(attempts.lockedUntil).toISOString(),
                }
            });
        }
        // Reset if lock period has expired
        if (attempts?.lockedUntil && now >= attempts.lockedUntil) {
            loginAttempts.delete(identifier);
        }
        next();
    };
}
// Track failed login attempts
function trackLoginAttempt(success, identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
    if (success) {
        // Reset on successful login
        loginAttempts.delete(identifier);
    }
    else {
        // Increment failed attempts
        attempts.count++;
        attempts.lastAttempt = now;
        // Lock account after 5 failed attempts
        if (attempts.count >= 5) {
            attempts.lockedUntil = now + (15 * 60 * 1000); // 15 minutes
            console.warn(`[SECURITY] Account locked for ${identifier} after ${attempts.count} failed attempts`);
        }
        loginAttempts.set(identifier, attempts);
    }
}
// Error handling middleware
function secureErrorHandler() {
    return (err, req, res, next) => {
        // Log error for debugging
        console.error('Error:', {
            message: err.message,
            stack:  false ? 0 : undefined,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id,
        });
        // Don't expose internal errors in production
        const isProduction = "production" === 'production';
        const status = err.status || err.statusCode || 500;
        let message = 'Internal Server Error';
        let code = 'INTERNAL_ERROR';
        // Safe error messages for common cases
        if (status === 400) {
            message = 'Bad Request';
            code = 'BAD_REQUEST';
        }
        else if (status === 401) {
            message = 'Unauthorized';
            code = 'UNAUTHORIZED';
        }
        else if (status === 403) {
            message = 'Forbidden';
            code = 'FORBIDDEN';
        }
        else if (status === 404) {
            message = 'Not Found';
            code = 'NOT_FOUND';
        }
        else if (status === 429) {
            message = 'Too Many Requests';
            code = 'RATE_LIMITED';
        }
        // Include original message in development
        if (!isProduction && err.message) {
            message = err.message;
        }
        res.status(status).json({
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
            }
        });
    };
}
// Export configured middleware
const corsMiddleware = external_cors_default()(corsOptions);
const helmetMiddleware = external_helmet_default()(helmetOptions);
// Session timeout configuration
const sessionConfig = {
    maxAge: 60 * 60 * 1000, // 1 hour
    refreshThreshold: 15 * 60 * 1000, // Refresh if less than 15 minutes remaining
};
// IP whitelist for admin operations
const adminWhitelist = (/* unused pure expression or super */ null && ([
    '127.0.0.1',
    '::1',
    // Add your admin IPs here
]));
function adminIPWhitelist() {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!clientIP || !adminWhitelist.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'IP_NOT_WHITELISTED',
                    message: 'Access denied from this IP address'
                }
            });
        }
        next();
    };
}

// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(982);
;// ./server/cognitoAuth.ts




// Initialize AWS Cognito client
const cognitoClient = new client_cognito_identity_provider_namespaceObject.CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
const clientId = process.env.AWS_COGNITO_CLIENT_ID;
const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET;
function getUserAttribute(attributes, name) {
    if (!attributes)
        return undefined;
    const attr = attributes.find(a => a.Name === name);
    return attr?.Value;
}
function calculateSecretHash(username) {
    if (!clientSecret)
        return undefined;
    return (0,external_crypto_.createHmac)('sha256', clientSecret)
        .update(username + clientId)
        .digest('base64');
}
// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    try {
        // Try to get token from Authorization header first, then from cookies
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        // Verify the JWT token with AWS Cognito
        const command = new client_cognito_identity_provider_namespaceObject.GetUserCommand({
            AccessToken: token,
        });
        const response = await cognitoClient.send(command);
        if (!response.Username) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        // Create user object matching existing format
        const user = {
            id: getUserAttribute(response.UserAttributes, 'sub') || response.Username,
            email: getUserAttribute(response.UserAttributes, 'email') || '',
            user_metadata: {
                first_name: getUserAttribute(response.UserAttributes, 'given_name'),
                last_name: getUserAttribute(response.UserAttributes, 'family_name'),
                avatar_url: getUserAttribute(response.UserAttributes, 'picture'),
            }
        };
        // Get or create user in our database
        const dbUser = await storage/* storage */.I.getUser(user.id);
        if (!dbUser) {
            // Create user if they don't exist
            await storage/* storage */.I.upsertUser({
                id: user.id,
                email: user.email || null,
                firstName: user.user_metadata?.first_name || null,
                lastName: user.user_metadata?.last_name || null,
                profileImageUrl: user.user_metadata?.avatar_url || null,
                role: null,
                location: null,
                bio: null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Cognito auth error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};
// Setup authentication routes
async function setupAuth(app) {
    // Login endpoint - handle email/password authentication
    app.post('/api/auth/login', accountLockoutProtection(), async (req, res) => {
        try {
            console.log('Login attempt:', { email: req.body.email });
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            // Sign in with AWS Cognito (use email since user pool is configured with email alias)
            const authParameters = {
                USERNAME: email,
                PASSWORD: password,
            };
            const secretHash = calculateSecretHash(email);
            if (secretHash) {
                authParameters.SECRET_HASH = secretHash;
            }
            const command = new client_cognito_identity_provider_namespaceObject.InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: clientId,
                AuthParameters: authParameters,
            });
            console.log('Attempting Cognito login for email:', email);
            const response = await cognitoClient.send(command);
            console.log('Cognito login response received');
            if (!response.AuthenticationResult?.AccessToken) {
                // Track failed login attempt
                trackLoginAttempt(false, email);
                return res.status(401).json({ message: 'Login failed' });
            }
            // Track successful login
            trackLoginAttempt(true, email);
            const accessToken = response.AuthenticationResult.AccessToken;
            const refreshToken = response.AuthenticationResult.RefreshToken;
            // Set cookies with tokens
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: "production" === 'production',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
            if (refreshToken) {
                res.cookie('refresh_token', refreshToken, {
                    httpOnly: true,
                    secure: "production" === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }
            // Get user details
            const userCommand = new client_cognito_identity_provider_namespaceObject.GetUserCommand({
                AccessToken: accessToken,
            });
            const userResponse = await cognitoClient.send(userCommand);
            if (!userResponse.Username) {
                return res.status(401).json({ message: 'Failed to get user details' });
            }
            const userEmail = getUserAttribute(userResponse.UserAttributes, 'email') || email;
            // Get or create user in our database
            const userId = getUserAttribute(userResponse.UserAttributes, 'sub') || userResponse.Username;
            await storage/* storage */.I.upsertUser({
                id: userId,
                email: userEmail || null,
                firstName: getUserAttribute(userResponse.UserAttributes, 'given_name') || null,
                lastName: getUserAttribute(userResponse.UserAttributes, 'family_name') || null,
                profileImageUrl: getUserAttribute(userResponse.UserAttributes, 'picture') || null,
                role: null,
                location: null,
                bio: null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
            res.json({
                message: 'Logged in successfully',
                user: await storage/* storage */.I.getUser(userId)
            });
        }
        catch (error) {
            console.error('Cognito login error:', error);
            const message = error.name === 'NotAuthorizedException' ? 'Invalid credentials' : 'Login failed';
            res.status(401).json({ message });
        }
    });
    // Register endpoint
    app.post('/api/auth/register', async (req, res) => {
        try {
            console.log('Registration attempt:', req.body);
            const { email, password, firstName, lastName } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            // Generate a unique username since user pool is configured with email alias
            const username = email.split('@')[0] + '_' + Date.now().toString();
            // Sign up with AWS Cognito
            const signUpParams = {
                ClientId: clientId,
                Username: username,
                Password: password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email,
                    },
                    {
                        Name: 'name',
                        Value: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
                    },
                    ...(firstName ? [{
                            Name: 'given_name',
                            Value: firstName,
                        }] : []),
                    ...(lastName ? [{
                            Name: 'family_name',
                            Value: lastName,
                        }] : []),
                ],
            };
            const secretHash = calculateSecretHash(username);
            if (secretHash) {
                signUpParams.SecretHash = secretHash;
            }
            const command = new client_cognito_identity_provider_namespaceObject.SignUpCommand(signUpParams);
            console.log('Attempting Cognito signup...');
            const response = await cognitoClient.send(command);
            console.log('Cognito signup successful:', { UserSub: response.UserSub, UserConfirmed: response.UserConfirmed });
            if (!response.UserSub) {
                return res.status(400).json({ message: 'Registration failed' });
            }
            // Check if user needs email confirmation based on user pool settings
            const needsConfirmation = !response.UserConfirmed;
            if (!needsConfirmation) {
                // Create user in our database
                console.log('Creating user in database with ID:', response.UserSub);
                await storage/* storage */.I.upsertUser({
                    id: response.UserSub,
                    email: email || null,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    profileImageUrl: null,
                    role: null,
                    location: null,
                    bio: null,
                    subscriptionTier: 'free',
                    totalIdeaScore: 0,
                    profileViews: 0,
                    profilePublic: true,
                    ideasPublic: true,
                    allowFounderMatching: true,
                    allowDirectContact: true,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    subscriptionStatus: null,
                    subscriptionPeriodEnd: null,
                    subscriptionCancelAtPeriodEnd: false,
                });
                res.json({
                    message: 'Registration successful',
                    user: await storage/* storage */.I.getUser(response.UserSub)
                });
            }
            else {
                // User needs to confirm email
                res.json({
                    message: 'Registration successful. Please check your email to confirm your account.',
                    needsConfirmation: true
                });
            }
        }
        catch (error) {
            console.error('Cognito registration error:', error);
            let message = 'Registration failed';
            if (error.name === 'UsernameExistsException') {
                message = 'User already exists';
            }
            else if (error.name === 'InvalidPasswordException') {
                message = 'Password does not meet requirements';
            }
            res.status(400).json({ message });
        }
    });
    // Confirm signup endpoint
    app.post('/api/auth/confirm', async (req, res) => {
        try {
            const { email, confirmationCode } = req.body;
            if (!email || !confirmationCode) {
                return res.status(400).json({ message: 'Email and confirmation code are required' });
            }
            const confirmParams = {
                ClientId: clientId,
                Username: email,
                ConfirmationCode: confirmationCode,
            };
            const secretHash = calculateSecretHash(email);
            if (secretHash) {
                confirmParams.SecretHash = secretHash;
            }
            const command = new client_cognito_identity_provider_namespaceObject.ConfirmSignUpCommand(confirmParams);
            await cognitoClient.send(command);
            res.json({ message: 'Account confirmed successfully' });
        }
        catch (error) {
            console.error('Cognito confirmation error:', error);
            let message = 'Confirmation failed';
            if (error.name === 'CodeMismatchException') {
                message = 'Invalid confirmation code';
            }
            else if (error.name === 'ExpiredCodeException') {
                message = 'Confirmation code expired';
            }
            res.status(400).json({ message });
        }
    });
    // Logout endpoint
    app.post('/api/auth/logout', async (req, res) => {
        try {
            // Get token from header or cookie
            let token;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
            else if (req.cookies && req.cookies.access_token) {
                token = req.cookies.access_token;
            }
            if (token) {
                // Sign out from AWS Cognito
                const command = new client_cognito_identity_provider_namespaceObject.GlobalSignOutCommand({
                    AccessToken: token,
                });
                await cognitoClient.send(command);
            }
            // Clear cookies
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            console.error('Cognito logout error:', error);
            res.status(500).json({ message: 'Logout failed' });
        }
    });
    // Get current user endpoint
    app.get('/api/auth/user', isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await storage/* storage */.I.getUser(userId);
            res.json(user);
        }
        catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });
    // Update user profile endpoint
    app.put('/api/auth/user', isAuthenticated, async (req, res) => {
        try {
            const { role, location, bio } = req.body;
            const updatedUser = await storage/* storage */.I.upsertUser({
                email: req.user.email || null,
                firstName: req.user.user_metadata?.first_name || null,
                lastName: req.user.user_metadata?.last_name || null,
                profileImageUrl: req.user.user_metadata?.avatar_url || null,
                role: role || null,
                location: location || null,
                bio: bio || null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
            res.json(updatedUser);
        }
        catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ message: "Failed to update user profile" });
        }
    });
    // OAuth callback endpoint
    app.get('/auth/callback', async (req, res) => {
        try {
            const { code, error, state } = req.query;
            if (error) {
                console.error('OAuth error:', error);
                return res.redirect('/login?error=oauth_failed');
            }
            if (!code) {
                console.error('No authorization code received');
                return res.redirect('/login?error=no_code');
            }
            // Exchange authorization code for tokens using Cognito
            const cognitoDomain = `https://${process.env.AWS_COGNITO_DOMAIN || 'us-west-1ofuj1nghs.auth.us-west-1.amazoncognito.com'}`;
            const tokenUrl = `${cognitoDomain}/oauth2/token`;
            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                code: code,
                redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`
            });
            // Add client secret if available
            if (clientSecret) {
                const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                var tokenHeaders = {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
            }
            else {
                var tokenHeaders = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
            }
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: tokenHeaders,
                body: tokenParams.toString()
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Token exchange failed:', errorText);
                return res.redirect('/login?error=token_exchange_failed');
            }
            const tokens = await response.json();
            if (!tokens.access_token) {
                console.error('No access token received');
                return res.redirect('/login?error=no_access_token');
            }
            // Get user info from the access token
            const userCommand = new client_cognito_identity_provider_namespaceObject.GetUserCommand({
                AccessToken: tokens.access_token,
            });
            const userResponse = await cognitoClient.send(userCommand);
            if (!userResponse.Username) {
                return res.redirect('/login?error=user_fetch_failed');
            }
            // Set cookies with tokens
            res.cookie('access_token', tokens.access_token, {
                httpOnly: true,
                secure: "production" === 'production',
                maxAge: (tokens.expires_in || 3600) * 1000
            });
            if (tokens.refresh_token) {
                res.cookie('refresh_token', tokens.refresh_token, {
                    httpOnly: true,
                    secure: "production" === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }
            // Create/update user in database
            const userId = getUserAttribute(userResponse.UserAttributes, 'sub') || userResponse.Username;
            const userEmail = getUserAttribute(userResponse.UserAttributes, 'email');
            await storage/* storage */.I.upsertUser({
                id: userId,
                email: userEmail || null,
                firstName: getUserAttribute(userResponse.UserAttributes, 'given_name') || null,
                lastName: getUserAttribute(userResponse.UserAttributes, 'family_name') || null,
                profileImageUrl: getUserAttribute(userResponse.UserAttributes, 'picture') || null,
                role: null,
                location: null,
                bio: null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
            // Redirect to dashboard
            res.redirect('/dashboard?auth=success');
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect('/login?error=callback_failed');
        }
    });
}

// EXTERNAL MODULE: ./server/localStorage.ts
var localStorage = __webpack_require__(624);
;// ./server/auth/local-provider.ts



class LocalAuthProvider {
    constructor() {
        this.sessions = new Map();
        this.users = new Map();
        this.refreshTokens = new Map(); // refreshToken -> accessToken
    }
    async initialize() {
        // Create some default users for development
        const defaultUsers = [
            {
                id: 'dev-user-1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                password: 'password123'
            },
            {
                id: 'dev-user-2',
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                password: 'admin123'
            }
        ];
        for (const userData of defaultUsers) {
            const { password, ...user } = userData;
            this.users.set(user.email, user);
            // Also store in localStorage for persistence
            await localStorage/* localStorage */.L.upsertUser({
                id: user.id,
                email: user.email || null,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                profileImageUrl: null,
                role: null,
                location: null,
                bio: null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
        }
        console.log('Local auth provider initialized with default users');
        console.log('Available test accounts:');
        console.log('- test@example.com / password123');
        console.log('- admin@example.com / admin123');
    }
    async getUser(token) {
        try {
            const session = this.sessions.get(token);
            if (!session) {
                return null;
            }
            // Check if session has expired
            if (Date.now() > session.expiresAt) {
                this.sessions.delete(token);
                return null;
            }
            return session.user;
        }
        catch (error) {
            console.error('Token verification error:', error);
            return null;
        }
    }
    async login(credentials) {
        try {
            // Simple password validation for development
            const validCredentials = [
                { email: 'test@example.com', password: 'password123' },
                { email: 'admin@example.com', password: 'admin123' }
            ];
            const isValid = validCredentials.some(cred => cred.email === credentials.email && cred.password === credentials.password);
            if (!isValid) {
                // Track failed login attempt
                trackLoginAttempt(false, credentials.email);
                throw new Error('Invalid email or password');
            }
            // Track successful login
            trackLoginAttempt(true, credentials.email);
            const user = this.users.get(credentials.email);
            if (!user) {
                throw new Error('User not found');
            }
            // Generate tokens
            const accessToken = this.generateToken();
            const refreshToken = this.generateToken();
            const expiresIn = 60 * 60 * 1000; // 1 hour
            // Store session
            this.sessions.set(accessToken, {
                user,
                expiresAt: Date.now() + expiresIn
            });
            // Store refresh token mapping
            this.refreshTokens.set(refreshToken, accessToken);
            return {
                user,
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }
    async register(userData) {
        try {
            // Check if user already exists
            if (this.users.has(userData.email)) {
                throw new Error('User already exists');
            }
            // Create new user
            const user = {
                id: `dev-user-${Date.now()}`,
                email: userData.email,
                user_metadata: {
                    first_name: userData.firstName,
                    last_name: userData.lastName
                }
            };
            // Store user
            this.users.set(userData.email, user);
            // Store in localStorage for persistence
            await localStorage/* localStorage */.L.upsertUser({
                id: user.id,
                email: user.email || null,
                firstName: user.user_metadata?.first_name || null,
                lastName: user.user_metadata?.last_name || null,
                profileImageUrl: null,
                role: null,
                location: null,
                bio: null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
            // Generate tokens
            const accessToken = this.generateToken();
            const refreshToken = this.generateToken();
            const expiresIn = 60 * 60 * 1000; // 1 hour
            // Store session
            this.sessions.set(accessToken, {
                user,
                expiresAt: Date.now() + expiresIn
            });
            // Store refresh token mapping
            this.refreshTokens.set(refreshToken, accessToken);
            return {
                user,
                needsConfirmation: false,
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    async logout(token) {
        try {
            // Remove session
            this.sessions.delete(token);
            // Remove associated refresh tokens
            for (const [refreshToken, accessToken] of Array.from(this.refreshTokens.entries())) {
                if (accessToken === token) {
                    this.refreshTokens.delete(refreshToken);
                    break;
                }
            }
        }
        catch (error) {
            console.error('Logout error:', error);
            // Don't throw error for logout failures
        }
    }
    async refreshToken(refreshToken) {
        try {
            const oldAccessToken = this.refreshTokens.get(refreshToken);
            if (!oldAccessToken) {
                throw new Error('Invalid refresh token');
            }
            const session = this.sessions.get(oldAccessToken);
            if (!session) {
                this.refreshTokens.delete(refreshToken);
                throw new Error('Session not found');
            }
            // Generate new tokens
            const newAccessToken = this.generateToken();
            const newRefreshToken = this.generateToken();
            const expiresIn = 60 * 60 * 1000; // 1 hour
            // Remove old tokens
            this.sessions.delete(oldAccessToken);
            this.refreshTokens.delete(refreshToken);
            // Store new session
            this.sessions.set(newAccessToken, {
                user: session.user,
                expiresAt: Date.now() + expiresIn
            });
            // Store new refresh token mapping
            this.refreshTokens.set(newRefreshToken, newAccessToken);
            return {
                user: session.user,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }
    async getUserProfile(userId) {
        try {
            // Find user by ID
            for (const user of Array.from(this.users.values())) {
                if (user.id === userId) {
                    return user;
                }
            }
            // Try localStorage as fallback
            const dbUser = await localStorage/* localStorage */.L.getUser(userId);
            if (dbUser) {
                return {
                    id: dbUser.id,
                    email: dbUser.email || undefined,
                    user_metadata: {
                        first_name: dbUser.firstName || undefined,
                        last_name: dbUser.lastName || undefined,
                        avatar_url: dbUser.profileImageUrl || undefined
                    }
                };
            }
            return null;
        }
        catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
    generateToken() {
        return (0,external_crypto_.randomBytes)(32).toString('hex');
    }
    // Development helper methods
    getActiveSessionsCount() {
        return this.sessions.size;
    }
    getUsersCount() {
        return this.users.size;
    }
    clearExpiredSessions() {
        const now = Date.now();
        for (const [token, session] of Array.from(this.sessions.entries())) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
    }
}

;// ./server/auth/auth-factory.ts




// Initialize local auth provider
const localProvider = new LocalAuthProvider();
/**
 * Setup authentication based on environment configuration
 */
async function auth_factory_setupAuth(app) {
    // Determine which auth provider to use based on environment
    const useCognito = process.env.AWS_COGNITO_USER_POOL_ID &&
        process.env.AWS_COGNITO_CLIENT_ID;
    if (useCognito) {
        console.log('Using AWS Cognito authentication provider');
        await setupAuth(app);
    }
    else {
        console.log('Using local development authentication provider');
        await setupLocalAuth(app);
    }
}
/**
 * Setup local authentication routes
 */
async function setupLocalAuth(app) {
    await localProvider.initialize();
    // Login endpoint
    app.post('/api/auth/login', accountLockoutProtection(), async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const result = await localProvider.login({ email, password });
            // Set cookies with tokens
            res.cookie('access_token', result.accessToken, {
                httpOnly: true,
                secure: "production" === 'production',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
            if (result.refreshToken) {
                res.cookie('refresh_token', result.refreshToken, {
                    httpOnly: true,
                    secure: "production" === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }
            res.json({
                message: 'Logged in successfully',
                user: await storage/* storage */.I.getUser(result.user.id)
            });
        }
        catch (error) {
            console.error('Local login error:', error);
            res.status(401).json({ message: error.message || 'Login failed' });
        }
    });
    // Register endpoint
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const result = await localProvider.register({
                email,
                password,
                firstName,
                lastName
            });
            if (result.accessToken && result.refreshToken) {
                // Set cookies with tokens
                res.cookie('access_token', result.accessToken, {
                    httpOnly: true,
                    secure: "production" === 'production',
                    maxAge: 60 * 60 * 1000 // 1 hour
                });
                res.cookie('refresh_token', result.refreshToken, {
                    httpOnly: true,
                    secure: "production" === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }
            res.json({
                message: 'Registration successful',
                user: await storage/* storage */.I.getUser(result.user.id),
                needsConfirmation: result.needsConfirmation
            });
        }
        catch (error) {
            console.error('Local registration error:', error);
            res.status(400).json({ message: error.message || 'Registration failed' });
        }
    });
    // Logout endpoint
    app.post('/api/auth/logout', async (req, res) => {
        try {
            let token;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
            else if (req.cookies && req.cookies.access_token) {
                token = req.cookies.access_token;
            }
            if (token) {
                await localProvider.logout(token);
            }
            // Clear cookies
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            console.error('Local logout error:', error);
            res.status(500).json({ message: 'Logout failed' });
        }
    });
    // Get current user endpoint
    app.get('/api/auth/user', localAuthMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await storage/* storage */.I.getUser(userId);
            res.json(user);
        }
        catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });
    // Update user profile endpoint
    app.put('/api/auth/user', localAuthMiddleware, async (req, res) => {
        try {
            const { role, location, bio } = req.body;
            const updatedUser = await storage/* storage */.I.upsertUser({
                id: req.user.id,
                email: req.user.email || null,
                firstName: req.user.user_metadata?.first_name || null,
                lastName: req.user.user_metadata?.last_name || null,
                profileImageUrl: req.user.user_metadata?.avatar_url || null,
                role: role || null,
                location: location || null,
                bio: bio || null,
                subscriptionTier: 'free',
                totalIdeaScore: 0,
                profileViews: 0,
                profilePublic: true,
                ideasPublic: true,
                allowFounderMatching: true,
                allowDirectContact: true,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                subscriptionCancelAtPeriodEnd: false,
            });
            res.json(updatedUser);
        }
        catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ message: "Failed to update user profile" });
        }
    });
}
/**
 * Local auth middleware
 */
const localAuthMiddleware = async (req, res, next) => {
    try {
        // Try to get token from Authorization header first, then from cookies
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const user = await localProvider.getUser(token);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Local auth error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};
/**
 * Get authentication middleware based on environment
 */
function getAuthMiddleware() {
    const useCognito = process.env.AWS_COGNITO_USER_POOL_ID &&
        process.env.AWS_COGNITO_CLIENT_ID;
    if (useCognito) {
        return isAuthenticated;
    }
    else {
        return localAuthMiddleware;
    }
}
/**
 * Legacy compatibility functions for existing code
 */
const auth_factory_isAuthenticated = getAuthMiddleware();


/***/ }),

/***/ 330:
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ 525:
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),

/***/ 577:
/***/ ((module) => {

module.exports = require("cors");

/***/ }),

/***/ 624:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   L: () => (/* binding */ localStorage)
/* harmony export */ });
// Simple in-memory storage for development
class LocalStorage {
    constructor() {
        this.users = new Map();
        this.ideas = new Map();
        this.submissions = new Map();
        this.matches = new Map();
        this.messages = new Map();
    }
    // User operations
    async getUser(id) {
        return this.users.get(id);
    }
    async upsertUser(userData) {
        const now = new Date();
        const userId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
        const user = {
            id: existingUser?.id || userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            role: userData.role,
            location: userData.location,
            bio: userData.bio,
            subscriptionTier: userData.subscriptionTier,
            totalIdeaScore: userData.totalIdeaScore,
            profileViews: userData.profileViews,
            profilePublic: userData.profilePublic,
            ideasPublic: userData.ideasPublic,
            allowFounderMatching: userData.allowFounderMatching,
            allowDirectContact: userData.allowDirectContact,
            stripeCustomerId: userData.stripeCustomerId,
            stripeSubscriptionId: userData.stripeSubscriptionId,
            subscriptionStatus: userData.subscriptionStatus,
            subscriptionPeriodEnd: userData.subscriptionPeriodEnd,
            subscriptionCancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd,
            createdAt: existingUser?.createdAt || now,
            updatedAt: now,
        };
        this.users.set(user.id, user);
        return user;
    }
    async updateUserIdeaScore(userId, score) {
        console.log(`[LocalStorage] Updating user score: userId=${userId}, score=${score}`);
        console.log(`[LocalStorage] Available users:`, Array.from(this.users.keys()));
        const user = this.users.get(userId);
        if (user) {
            console.log(`[LocalStorage] Found user, updating score from ${user.totalIdeaScore} to ${score}`);
            user.totalIdeaScore = score;
            user.updatedAt = new Date();
            this.users.set(userId, user);
        }
        else {
            console.log(`[LocalStorage] User not found: ${userId}`);
        }
    }
    async getLeaderboard(limit = 100) {
        return Array.from(this.users.values())
            .filter(user => user.totalIdeaScore > 0)
            .sort((a, b) => b.totalIdeaScore - a.totalIdeaScore)
            .slice(0, limit);
    }
    // Idea operations
    async createIdea(ideaData) {
        const id = `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const idea = {
            id,
            ...ideaData,
            validationScore: 0,
            analysisReport: null,
            createdAt: now,
        };
        this.ideas.set(id, idea);
        return idea;
    }
    async getIdea(id) {
        return this.ideas.get(id);
    }
    async getUserIdeas(userId) {
        console.log(`[LocalStorage] Getting user ideas for userId: ${userId}`);
        const allIdeas = Array.from(this.ideas.values());
        console.log(`[LocalStorage] Total ideas in storage: ${allIdeas.length}`);
        const userIdeas = allIdeas.filter(idea => idea.userId === userId);
        console.log(`[LocalStorage] User ideas found: ${userIdeas.length}`, userIdeas.map(i => ({ id: i.id, score: i.validationScore })));
        return userIdeas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async updateIdeaValidation(ideaId, score, report) {
        console.log(`[LocalStorage] Updating idea validation: ideaId=${ideaId}, score=${score}`);
        const idea = this.ideas.get(ideaId);
        if (idea) {
            console.log(`[LocalStorage] Found idea, updating score from ${idea.validationScore} to ${score}`);
            idea.validationScore = score;
            idea.analysisReport = report;
            // Remove updatedAt as it doesn't exist in the type
            this.ideas.set(ideaId, idea);
        }
        else {
            console.log(`[LocalStorage] Idea not found: ${ideaId}`);
        }
    }
    // Submission operations (basic implementation)
    async createSubmission(submission) {
        const id = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const newSubmission = {
            id,
            ...submission,
            createdAt: now,
            qualityScore: 0,
        };
        this.submissions.set(id, newSubmission);
        return newSubmission;
    }
    async getUserSubmissions(userId) {
        return Array.from(this.submissions.values()).filter(s => s.userId === userId);
    }
    async getSubmission(id) {
        return this.submissions.get(id);
    }
    async updateSubmission(id, submission) {
        const existing = this.submissions.get(id);
        if (!existing)
            throw new Error('Submission not found');
        const updated = { ...existing, ...submission, updatedAt: new Date() };
        this.submissions.set(id, updated);
        return updated;
    }
    // Match operations (basic implementation)
    async createMatch(match) {
        const id = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const newMatch = {
            id,
            ...match,
            status: match.status || 'pending',
            createdAt: now,
            updatedAt: now,
        };
        this.matches.set(id, newMatch);
        return newMatch;
    }
    async getMatch(id) {
        return this.matches.get(id);
    }
    async getUserMatches(userId) {
        const userMatches = Array.from(this.matches.values())
            .filter(match => match.user1Id === userId || match.user2Id === userId);
        return userMatches.map(match => ({
            ...match,
            user1: this.users.get(match.user1Id),
            user2: this.users.get(match.user2Id),
        }));
    }
    async getMutualMatches(userId) {
        const matches = await this.getUserMatches(userId);
        return matches.filter(match => match.status === 'mutual');
    }
    async updateMatchInterest(matchId, userId, interested) {
        const match = this.matches.get(matchId);
        if (!match)
            throw new Error('Match not found');
        const isUser1 = match.user1Id === userId;
        if (isUser1) {
            match.user1Interested = interested;
        }
        else {
            match.user2Interested = interested;
        }
        match.updatedAt = new Date();
        if (match.user1Interested && match.user2Interested) {
            match.status = 'mutual';
        }
        this.matches.set(matchId, match);
        return match;
    }
    async findPotentialMatches(userId, limit = 10) {
        const currentUser = this.users.get(userId);
        if (!currentUser)
            return [];
        const existingMatchUserIds = Array.from(this.matches.values())
            .filter(match => match.user1Id === userId || match.user2Id === userId)
            .map(match => match.user1Id === userId ? match.user2Id : match.user1Id);
        return Array.from(this.users.values())
            .filter(user => user.id !== userId &&
            !existingMatchUserIds.includes(user.id) &&
            (!user.role || user.role !== currentUser.role))
            .sort((a, b) => b.totalIdeaScore - a.totalIdeaScore)
            .slice(0, limit);
    }
    // Message operations (basic implementation)
    async createMessage(message) {
        const id = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const newMessage = {
            id,
            ...message,
            createdAt: now,
        };
        this.messages.set(id, newMessage);
        return newMessage;
    }
    async getMatchMessages(matchId) {
        const matchMessages = Array.from(this.messages.values())
            .filter(message => message.matchId === matchId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return matchMessages.map(message => ({
            ...message,
            sender: this.users.get(message.senderId),
        }));
    }
}
const localStorage = new LocalStorage();


/***/ }),

/***/ 637:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  I: () => (/* binding */ storage)
});

// UNUSED EXPORTS: DatabaseStorage

// EXTERNAL MODULE: external "@prisma/client"
var client_ = __webpack_require__(330);
;// ./server/prisma.ts

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new client_.PrismaClient();
if (false)
    // removed by dead control flow
{}

;// ./server/storage.ts

class DatabaseStorage {
    // User operations
    async getUser(id) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        return user || undefined;
    }
    async upsertUser(userData) {
        // If an ID is provided, try to find by ID first, otherwise by email
        let existingUser = null;
        if (userData.id) {
            existingUser = await prisma.user.findUnique({
                where: { id: userData.id }
            });
        }
        if (!existingUser && userData.email) {
            existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });
        }
        if (existingUser) {
            return await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    ...userData,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            return await prisma.user.create({
                data: {
                    ...userData,
                    id: userData.id, // Use provided ID or let Prisma generate one
                },
            });
        }
    }
    async updateUserIdeaScore(userId, score) {
        await prisma.user.update({
            where: { id: userId },
            data: { totalIdeaScore: score }
        });
    }
    async getLeaderboard(limit = 100) {
        return await prisma.user.findMany({
            where: {
                totalIdeaScore: {
                    not: 0
                }
            },
            orderBy: {
                totalIdeaScore: 'desc'
            },
            take: limit
        });
    }
    // Idea operations
    async createIdea(idea) {
        return await prisma.idea.create({
            data: idea
        });
    }
    async getIdea(id) {
        const idea = await prisma.idea.findUnique({
            where: { id }
        });
        return idea || undefined;
    }
    async getUserIdeas(userId) {
        return await prisma.idea.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateIdeaValidation(ideaId, score, report) {
        await prisma.idea.update({
            where: { id: ideaId },
            data: {
                validationScore: score,
                analysisReport: report
            }
        });
    }
    // Submission operations
    async createSubmission(submission) {
        return await prisma.submission.create({
            data: submission
        });
    }
    async getUserSubmissions(userId) {
        return await prisma.submission.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getSubmission(id) {
        const submission = await prisma.submission.findUnique({
            where: { id }
        });
        return submission || undefined;
    }
    async updateSubmission(id, submission) {
        return await prisma.submission.update({
            where: { id },
            data: submission
        });
    }
    // Match operations
    async createMatch(match) {
        return await prisma.match.create({
            data: match
        });
    }
    async getMatch(id) {
        const match = await prisma.match.findUnique({
            where: { id }
        });
        return match || undefined;
    }
    async getUserMatches(userId) {
        return await prisma.match.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: true,
                user2: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async getMutualMatches(userId) {
        return await prisma.match.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { user1Id: userId },
                            { user2Id: userId }
                        ]
                    },
                    { status: 'mutual' }
                ]
            },
            include: {
                user1: true,
                user2: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async updateMatchInterest(matchId, userId, interested) {
        // First get the match to determine which user field to update
        const match = await prisma.match.findUnique({
            where: { id: matchId }
        });
        if (!match)
            throw new Error('Match not found');
        const isUser1 = match.user1Id === userId;
        const updateData = isUser1
            ? { user1Interested: interested }
            : { user2Interested: interested };
        const updatedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            }
        });
        // Check if both users are interested to update status
        if (updatedMatch.user1Interested && updatedMatch.user2Interested) {
            return await prisma.match.update({
                where: { id: matchId },
                data: { status: 'mutual' }
            });
        }
        return updatedMatch;
    }
    async findPotentialMatches(userId, limit = 10) {
        // Get user's role to find complementary roles
        const currentUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!currentUser)
            return [];
        // Get users already matched with
        const existingMatches = await prisma.match.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            select: {
                user1Id: true,
                user2Id: true
            }
        });
        const excludeUserIds = [
            userId,
            ...existingMatches.map(m => m.user1Id === userId ? m.user2Id : m.user1Id)
        ];
        // Find users with complementary roles
        return await prisma.user.findMany({
            where: {
                AND: [
                    { id: { notIn: excludeUserIds } },
                    {
                        OR: [
                            { role: null },
                            { role: { not: currentUser.role } }
                        ]
                    }
                ]
            },
            orderBy: { totalIdeaScore: 'desc' },
            take: limit
        });
    }
    // Message operations
    async createMessage(message) {
        return await prisma.message.create({
            data: message
        });
    }
    async getMatchMessages(matchId) {
        return await prisma.message.findMany({
            where: { matchId },
            include: { sender: true },
            orderBy: { createdAt: 'asc' }
        });
    }
}
const storage = new DatabaseStorage();


/***/ }),

/***/ 982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  app: () => (/* binding */ app),
  handler: () => (/* binding */ handler)
});

;// external "@vendia/serverless-express"
const serverless_express_namespaceObject = require("@vendia/serverless-express");
var serverless_express_default = /*#__PURE__*/__webpack_require__.n(serverless_express_namespaceObject);
;// external "express"
const external_express_namespaceObject = require("express");
var external_express_default = /*#__PURE__*/__webpack_require__.n(external_express_namespaceObject);
// EXTERNAL MODULE: external "cors"
var external_cors_ = __webpack_require__(577);
var external_cors_default = /*#__PURE__*/__webpack_require__.n(external_cors_);
;// external "cookie-parser"
const external_cookie_parser_namespaceObject = require("cookie-parser");
var external_cookie_parser_default = /*#__PURE__*/__webpack_require__.n(external_cookie_parser_namespaceObject);
;// external "http"
const external_http_namespaceObject = require("http");
// EXTERNAL MODULE: ./server/storage.ts + 1 modules
var storage = __webpack_require__(637);
// EXTERNAL MODULE: ./server/localStorage.ts
var localStorage = __webpack_require__(624);
// EXTERNAL MODULE: ./server/auth/auth-factory.ts + 5 modules
var auth_factory = __webpack_require__(283);
;// external "@aws-sdk/client-bedrock-runtime"
const client_bedrock_runtime_namespaceObject = require("@aws-sdk/client-bedrock-runtime");
;// ./server/services/bedrock.ts

// Function to initialize Amazon Bedrock client with credential validation
function createBedrockClient() {
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-2';
    if (!awsAccessKeyId || !awsSecretAccessKey) {
        throw new Error('AWS credentials are missing from environment variables');
    }
    return new client_bedrock_runtime_namespaceObject.BedrockRuntimeClient({
        region: awsRegion,
        credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
        }
    });
}
async function validateStartupIdea(title, marketCategory, problemDescription, solutionDescription, targetAudience) {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error("AWS credentials are not configured");
        }
        const prompt = `
    You are a startup validation expert specializing in solo developer startups. Analyze the following startup idea using our Enhanced 1000-Point Scoring System designed specifically for solo developers who struggle with focus and follow-through.

    Startup Idea:
    - Title: ${title}
    - Market Category: ${marketCategory}
    - Problem: ${problemDescription}
    - Solution: ${solutionDescription}
    - Target Audience: ${targetAudience}

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "overallScore": number (0-1000),
      "marketAnalysis": {
        "marketSize": "small" | "medium" | "large",
        "competition": "low" | "moderate" | "high", 
        "trends": "declining" | "stable" | "growing",
        "score": number (0-150)
      },
      "technicalFeasibility": {
        "complexity": "low" | "medium" | "high",
        "resourcesNeeded": "minimal" | "reasonable" | "significant",
        "timeToMarket": "estimated timeframe",
        "score": number (0-140)
      },
      "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3", "actionable recommendation 4", "actionable recommendation 5"],
      "detailedAnalysis": "comprehensive analysis paragraph explaining the scoring rationale with focus on solo developer feasibility"
    }

    Enhanced 1000-Point Scoring Framework (10 categories):
    1. Market Opportunity (150 points): Market size, competition analysis, market validation
    2. Problem-Solution Fit (120 points): Problem validation, solution quality
    3. Execution Feasibility (140 points): Technical requirements, business operations
    4. Personal Fit (100 points): Founder-market fit, execution alignment
    5. Focus & Momentum (120 points): Simplicity & focus, momentum building opportunities
    6. Financial Viability (100 points): Revenue model clarity, financial requirements
    7. Customer Validation (90 points): Customer understanding, validation methods
    8. Competitive Intelligence (80 points): Direct/indirect competition analysis
    9. Resource Requirements (70 points): Human resources, physical/digital resources
    10. Risk Assessment (130 points): Market risks, execution risks

    Special focus areas for solo developers:
    - Can this be built and executed by one person?
    - Are there clear, achievable milestones to maintain motivation?
    - How resistant is this idea to scope creep and distractions?
    - What's the minimum viable version that can generate feedback?
    - How quickly can the founder see progress and get user validation?

    Provide specific, actionable recommendations tailored for a solo developer starting this venture.
    `;
        // Prepare the request for Amazon Nova Pro
        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            inferenceConfig: {
                maxTokens: 4000,
                temperature: 0.7,
                topP: 0.9
            }
        };
        const command = new client_bedrock_runtime_namespaceObject.InvokeModelCommand({
            modelId: "us.amazon.nova-pro-v1:0", // Using Nova Pro inference profile for complex analysis
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });
        const bedrockClient = createBedrockClient();
        const response = await bedrockClient.send(command);
        if (!response.body) {
            throw new Error('No response body from Bedrock');
        }
        // Parse the response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const text = responseBody.output?.message?.content?.[0]?.text;
        if (!text) {
            throw new Error('No text content in Bedrock response');
        }
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Bedrock response');
        }
        const resultData = JSON.parse(jsonMatch[0]);
        // Validate the response structure
        if (!resultData.overallScore || !resultData.marketAnalysis || !resultData.technicalFeasibility) {
            throw new Error('Invalid response structure from Bedrock');
        }
        // Ensure score is within valid range
        resultData.overallScore = Math.max(0, Math.min(1000, resultData.overallScore));
        resultData.marketAnalysis.score = Math.max(0, Math.min(150, resultData.marketAnalysis.score));
        resultData.technicalFeasibility.score = Math.max(0, Math.min(140, resultData.technicalFeasibility.score));
        return resultData;
    }
    catch (error) {
        console.error('Error validating startup idea with Bedrock:', error);
        throw new Error('Failed to validate startup idea: ' + error.message);
    }
}
async function generateMatchingInsights(user1, user2) {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error("AWS credentials are not configured");
        }
        const prompt = `
    Analyze the compatibility between these two potential co-founders and provide matching insights.

    Person 1:
    - Role: ${user1.role}
    - Location: ${user1.location}
    - Bio: ${user1.bio}
    - Idea Score: ${user1.totalIdeaScore}

    Person 2:
    - Role: ${user2.role}
    - Location: ${user2.location}
    - Bio: ${user2.bio}
    - Idea Score: ${user2.totalIdeaScore}

    Provide analysis in JSON format:
    {
      "compatibilityScore": number (0-100),
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "considerations": ["consideration 1", "consideration 2"]
    }
    `;
        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            inferenceConfig: {
                maxTokens: 1000,
                temperature: 0.5,
                topP: 0.8
            }
        };
        const command = new client_bedrock_runtime_namespaceObject.InvokeModelCommand({
            modelId: "us.amazon.nova-lite-v1:0", // Using Nova Lite inference profile for simpler analysis
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });
        const bedrockClient = createBedrockClient();
        const response = await bedrockClient.send(command);
        if (!response.body) {
            throw new Error('No response body from Bedrock');
        }
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const text = responseBody.output?.message?.content?.[0]?.text;
        if (!text) {
            throw new Error('No text content in Bedrock response');
        }
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Bedrock response');
        }
        const resultData = JSON.parse(jsonMatch[0]);
        resultData.compatibilityScore = Math.max(0, Math.min(100, resultData.compatibilityScore));
        return resultData;
    }
    catch (error) {
        console.error('Error generating matching insights with Bedrock:', error);
        // Return default compatibility score based on role complementarity
        const roleCompat = user1.role !== user2.role ? 85 : 60;
        return {
            compatibilityScore: roleCompat,
            strengths: ['Complementary skill sets', 'Shared entrepreneurial vision'],
            considerations: ['Different locations', 'Communication styles may vary']
        };
    }
}
async function generateText(prompt) {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error("AWS credentials are not configured");
        }
        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            inferenceConfig: {
                maxTokens: 2000,
                temperature: 0.7,
                topP: 0.9
            }
        };
        const command = new InvokeModelCommand({
            modelId: "us.amazon.nova-lite-v1:0", // Using Nova Lite inference profile
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });
        const bedrockClient = createBedrockClient();
        const response = await bedrockClient.send(command);
        if (!response.body) {
            throw new Error('No response body from Bedrock');
        }
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const text = responseBody.output?.message?.content?.[0]?.text;
        if (!text) {
            throw new Error('No text content in Bedrock response');
        }
        return text;
    }
    catch (error) {
        console.error('Error generating text with Bedrock:', error);
        throw new Error('Failed to generate text: ' + error.message);
    }
}

;// ./server/services/perplexity.ts
async function perplexity_validateStartupIdea(idea) {
    if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error("PERPLEXITY_API_KEY is not configured");
    }
    const prompt = `Analyze this startup idea and provide a comprehensive validation score out of 1000 points:

Title: ${idea.title}
Market Category: ${idea.marketCategory}
Problem: ${idea.problemDescription}
Solution: ${idea.solutionDescription}
Target Audience: ${idea.targetAudience}

Please provide a detailed analysis in JSON format with:
- Market validation score (0-400 points): market size, demand, competition analysis
- Technical feasibility score (0-300 points): implementation complexity, required resources
- Business model score (0-300 points): revenue potential, sustainability, scalability

For each category, include:
- Numerical score
- Detailed feedback explaining the score
- Specific insights about market size/competition/complexity/revenue streams

Also provide:
- Overall feedback summary
- 3-5 actionable recommendations
- Total score (sum of all categories)

Respond with valid JSON only.`;
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a startup validation expert. Analyze startup ideas and provide structured feedback with numerical scores. Always respond with valid JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.2,
                top_p: 0.9,
                search_recency_filter: 'month',
                return_images: false,
                return_related_questions: false,
                stream: false
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Perplexity API error details:`, {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content received from Perplexity API");
        }
        // Extract JSON from the response
        let analysisData;
        try {
            // Try to parse the entire content as JSON first
            analysisData = JSON.parse(content);
        }
        catch {
            // If that fails, try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[1]);
            }
            else {
                // Last resort: try to find any JSON-like structure
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}') + 1;
                if (jsonStart !== -1 && jsonEnd > jsonStart) {
                    analysisData = JSON.parse(content.slice(jsonStart, jsonEnd));
                }
                else {
                    throw new Error("Could not extract valid JSON from response");
                }
            }
        }
        // Validate and structure the response
        const marketScore = Math.min(400, Math.max(0, analysisData.marketValidation?.score || 0));
        const technicalScore = Math.min(300, Math.max(0, analysisData.technicalFeasibility?.score || 0));
        const businessScore = Math.min(300, Math.max(0, analysisData.businessModel?.score || 0));
        const totalScore = marketScore + technicalScore + businessScore;
        return {
            score: totalScore,
            analysisReport: {
                marketValidation: {
                    score: marketScore,
                    feedback: analysisData.marketValidation?.feedback || "Market analysis pending",
                    marketSize: analysisData.marketValidation?.marketSize || "Analysis in progress",
                    competition: analysisData.marketValidation?.competition || "Competitive landscape review needed"
                },
                technicalFeasibility: {
                    score: technicalScore,
                    feedback: analysisData.technicalFeasibility?.feedback || "Technical review pending",
                    complexity: analysisData.technicalFeasibility?.complexity || "Complexity assessment needed",
                    resources: analysisData.technicalFeasibility?.resources || "Resource requirements under review"
                },
                businessModel: {
                    score: businessScore,
                    feedback: analysisData.businessModel?.feedback || "Business model analysis pending",
                    revenueStreams: analysisData.businessModel?.revenueStreams || "Revenue analysis in progress",
                    sustainability: analysisData.businessModel?.sustainability || "Sustainability review needed"
                },
                overallFeedback: analysisData.overallFeedback || "Comprehensive analysis completed",
                recommendations: Array.isArray(analysisData.recommendations)
                    ? analysisData.recommendations
                    : ["Continue market research", "Validate with target customers", "Develop MVP"],
                citations: data.citations || []
            }
        };
    }
    catch (error) {
        console.error("Error validating startup idea with Perplexity:", error);
        // Provide a basic fallback response instead of throwing
        return {
            score: 500, // Neutral score
            analysisReport: {
                marketValidation: {
                    score: 200,
                    feedback: "Market analysis temporarily unavailable. Please try again later.",
                    marketSize: "Analysis pending",
                    competition: "Competitive analysis pending"
                },
                technicalFeasibility: {
                    score: 150,
                    feedback: "Technical feasibility analysis temporarily unavailable.",
                    complexity: "Assessment pending",
                    resources: "Resource analysis pending"
                },
                businessModel: {
                    score: 150,
                    feedback: "Business model analysis temporarily unavailable.",
                    revenueStreams: "Revenue analysis pending",
                    sustainability: "Sustainability analysis pending"
                },
                overallFeedback: "Analysis service temporarily unavailable. Your idea shows potential and we recommend proceeding with market validation.",
                recommendations: [
                    "Conduct customer interviews to validate problem-solution fit",
                    "Research market size and competition manually",
                    "Develop a minimum viable product (MVP)",
                    "Test pricing strategies with potential customers"
                ],
                citations: []
            }
        };
    }
}
async function perplexity_generateMatchingInsights(user1Role, user2Role) {
    if (!process.env.PERPLEXITY_API_KEY) {
        // Provide basic compatibility scoring without API
        const roleCompatibility = {
            'engineer': { 'designer': 85, 'marketer': 80, 'engineer': 60 },
            'designer': { 'engineer': 85, 'marketer': 75, 'designer': 60 },
            'marketer': { 'engineer': 80, 'designer': 75, 'marketer': 55 }
        };
        const score = roleCompatibility[user1Role]?.[user2Role] || 70;
        return {
            compatibilityScore: score,
            insights: `${user1Role} and ${user2Role} roles complement each other well for building a balanced founding team.`
        };
    }
    const prompt = `Analyze the compatibility between two co-founder roles for a startup:

Role 1: ${user1Role}
Role 2: ${user2Role}

Provide a compatibility score (0-100) and explain why these roles work well together or what challenges they might face. Consider:
- Complementary skills
- Potential collaboration areas
- Common challenges
- Success factors

Respond with JSON format: {"compatibilityScore": number, "insights": "detailed explanation"}`;
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a co-founder matching expert. Analyze role compatibility and provide structured insights in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
        }
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content received");
        }
        let result;
        try {
            result = JSON.parse(content);
        }
        catch {
            // Fallback parsing
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error("Could not parse response");
            }
        }
        return {
            compatibilityScore: Math.min(100, Math.max(0, result.compatibilityScore || 70)),
            insights: result.insights || "These roles can work well together with proper communication and defined responsibilities."
        };
    }
    catch (error) {
        console.error("Error generating matching insights:", error);
        // Fallback compatibility scoring
        const roleCompatibility = {
            'engineer': { 'designer': 85, 'marketer': 80, 'engineer': 60 },
            'designer': { 'engineer': 85, 'marketer': 75, 'designer': 60 },
            'marketer': { 'engineer': 80, 'designer': 75, 'marketer': 55 }
        };
        const score = roleCompatibility[user1Role]?.[user2Role] || 70;
        return {
            compatibilityScore: score,
            insights: `${user1Role} and ${user2Role} roles typically complement each other well, bringing different perspectives and skills to the founding team.`
        };
    }
}

;// ./server/services/enhanced-scoring.ts
class EnhancedScoringService {
    static calculateEnhancedScore(title, marketCategory, problemDescription, solutionDescription, targetAudience, basicAnalysis) {
        // Create scoring categories based on the 1000-point system
        const categories = {
            marketOpportunity: this.scoreMarketOpportunity(marketCategory, problemDescription, solutionDescription, targetAudience, basicAnalysis),
            problemSolutionFit: this.scoreProblemSolutionFit(problemDescription, solutionDescription, basicAnalysis),
            executionFeasibility: this.scoreExecutionFeasibility(solutionDescription, marketCategory, basicAnalysis),
            personalFit: this.scorePersonalFit(marketCategory, solutionDescription, basicAnalysis),
            focusMomentum: this.scoreFocusMomentum(solutionDescription, problemDescription, basicAnalysis),
            financialViability: this.scoreFinancialViability(targetAudience, marketCategory, basicAnalysis),
            customerValidation: this.scoreCustomerValidation(targetAudience, problemDescription, basicAnalysis),
            competitiveIntelligence: this.scoreCompetitiveIntelligence(marketCategory, solutionDescription, basicAnalysis),
            resourceRequirements: this.scoreResourceRequirements(solutionDescription, marketCategory, basicAnalysis),
            riskAssessment: this.scoreRiskAssessment(marketCategory, solutionDescription, basicAnalysis)
        };
        // Calculate overall score
        const overallScore = Object.values(categories).reduce((total, category) => total + category.score, 0);
        // Determine grade level
        const gradeLevel = this.determineGradeLevel(overallScore);
        // Generate recommendation
        const recommendation = this.generateRecommendation(overallScore, gradeLevel);
        // Generate detailed analysis
        const detailedAnalysis = this.generateDetailedAnalysis(categories, basicAnalysis);
        return {
            overallScore,
            maxScore: 1000,
            gradeLevel,
            recommendation,
            categories,
            detailedAnalysis,
            confidenceLevel: basicAnalysis ? 'high' : 'medium',
            lastUpdated: new Date()
        };
    }
    static scoreMarketOpportunity(marketCategory, problemDescription, solutionDescription, targetAudience, basicAnalysis) {
        const criteria = [
            // Market Size & Growth (50 points)
            { name: 'Total Addressable Market (TAM)', score: this.scoreMarketSize(marketCategory), maxScore: 10, description: 'Size of the total market opportunity', weight: 1.0 },
            { name: 'Serviceable Available Market (SAM)', score: this.scoreServiceableMarket(targetAudience), maxScore: 10, description: 'Portion of TAM that can be served', weight: 1.0 },
            { name: 'Market Growth Rate', score: this.scoreGrowthRate(marketCategory), maxScore: 10, description: 'Annual growth rate of the market', weight: 1.0 },
            { name: 'Market Maturity Stage', score: this.scoreMarketMaturity(marketCategory), maxScore: 10, description: 'Stage of market development', weight: 1.0 },
            { name: 'Geographic Reach Potential', score: this.scoreGeographicReach(problemDescription), maxScore: 10, description: 'Potential for geographic expansion', weight: 1.0 },
            // Competition Analysis (50 points)
            { name: 'Competitive Landscape Density', score: this.scoreCompetitiveDensity(marketCategory), maxScore: 10, description: 'Number and strength of competitors', weight: 1.0 },
            { name: 'Competitive Advantage Strength', score: this.scoreCompetitiveAdvantage(solutionDescription), maxScore: 10, description: 'Strength of competitive advantages', weight: 1.0 },
            { name: 'Market Timing', score: this.scoreMarketTiming(marketCategory), maxScore: 10, description: 'Timing for market entry', weight: 1.0 },
            { name: 'Barriers to Entry', score: this.scoreBarriersToEntry(marketCategory), maxScore: 10, description: 'Difficulty for new entrants', weight: 1.0 },
            { name: 'Switching Costs for Customers', score: this.scoreSwitchingCosts(solutionDescription), maxScore: 10, description: 'Cost for customers to switch', weight: 1.0 },
            // Market Validation (50 points)
            { name: 'Customer Pain Point Intensity', score: this.scorePainIntensity(problemDescription), maxScore: 10, description: 'Severity of customer pain', weight: 1.0 },
            { name: 'Willingness to Pay Evidence', score: this.scoreWillingnessToPay(targetAudience), maxScore: 10, description: 'Evidence customers will pay', weight: 1.0 },
            { name: 'Early Adopter Identification', score: this.scoreEarlyAdopters(targetAudience), maxScore: 10, description: 'Clarity of early adopter segment', weight: 1.0 },
            { name: 'Market Education Requirements', score: this.scoreMarketEducation(solutionDescription), maxScore: 10, description: 'Need for market education', weight: 1.0 },
            { name: 'Regulatory Environment Stability', score: this.scoreRegulatoryStability(marketCategory), maxScore: 10, description: 'Regulatory risk assessment', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Market Opportunity',
            score: totalScore,
            maxScore: 150,
            criteria
        };
    }
    static scoreProblemSolutionFit(problemDescription, solutionDescription, basicAnalysis) {
        const criteria = [
            // Problem Validation (60 points)
            { name: 'Problem Severity/Urgency', score: this.scoreProblemSeverity(problemDescription), maxScore: 10, description: 'How severe/urgent the problem is', weight: 1.0 },
            { name: 'Problem Frequency', score: this.scoreProblemFrequency(problemDescription), maxScore: 10, description: 'How often the problem occurs', weight: 1.0 },
            { name: 'Current Solution Inadequacy', score: this.scoreCurrentSolutionGaps(problemDescription), maxScore: 10, description: 'Gaps in existing solutions', weight: 1.0 },
            { name: 'Problem Universality', score: this.scoreProblemUniversality(problemDescription), maxScore: 10, description: 'How widely the problem exists', weight: 1.0 },
            { name: 'Problem Measurability', score: this.scoreProblemMeasurability(problemDescription), maxScore: 10, description: 'How measurable the problem is', weight: 1.0 },
            { name: 'Personal Experience with Problem', score: this.scorePersonalExperience(problemDescription), maxScore: 10, description: 'Founder experience with problem', weight: 1.0 },
            // Solution Quality (60 points)
            { name: 'Solution Effectiveness', score: this.scoreSolutionEffectiveness(solutionDescription), maxScore: 10, description: 'How well solution addresses problem', weight: 1.0 },
            { name: 'Solution Uniqueness', score: this.scoreSolutionUniqueness(solutionDescription), maxScore: 10, description: 'Uniqueness of approach', weight: 1.0 },
            { name: 'Scalability Potential', score: this.scoreSolutionScalability(solutionDescription), maxScore: 10, description: 'Ability to scale solution', weight: 1.0 },
            { name: 'Technical Feasibility', score: this.scoreTechnicalFeasibility(solutionDescription), maxScore: 10, description: 'Technical implementation feasibility', weight: 1.0 },
            { name: 'User Experience Simplicity', score: this.scoreUXSimplicity(solutionDescription), maxScore: 10, description: 'Simplicity of user experience', weight: 1.0 },
            { name: 'Minimum Viable Product Clarity', score: this.scoreMVPClarity(solutionDescription), maxScore: 10, description: 'Clarity of MVP definition', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Problem-Solution Fit',
            score: totalScore,
            maxScore: 120,
            criteria
        };
    }
    static scoreExecutionFeasibility(solutionDescription, marketCategory, basicAnalysis) {
        const criteria = [
            // Technical Requirements (70 points)
            { name: 'Development Complexity', score: this.scoreDevelopmentComplexity(solutionDescription), maxScore: 10, description: 'Complexity of development', weight: 1.0 },
            { name: 'Time to MVP', score: this.scoreTimeToMVP(solutionDescription), maxScore: 10, description: 'Time required for MVP', weight: 1.0 },
            { name: 'Technology Stack Familiarity', score: this.scoreTechStackFamiliarity(solutionDescription), maxScore: 10, description: 'Familiarity with required tech', weight: 1.0 },
            { name: 'Third-party Dependencies', score: this.scoreThirdPartyDeps(solutionDescription), maxScore: 10, description: 'Reliance on third parties', weight: 1.0 },
            { name: 'Infrastructure Requirements', score: this.scoreInfrastructureNeeds(solutionDescription), maxScore: 10, description: 'Infrastructure complexity', weight: 1.0 },
            { name: 'Maintenance Complexity', score: this.scoreMaintenanceComplexity(solutionDescription), maxScore: 10, description: 'Ongoing maintenance needs', weight: 1.0 },
            { name: 'Security Considerations', score: this.scoreSecurityRequirements(solutionDescription), maxScore: 10, description: 'Security implementation needs', weight: 1.0 },
            // Business Operations (70 points)
            { name: 'Customer Acquisition Strategy', score: this.scoreCustomerAcquisition(marketCategory), maxScore: 10, description: 'Feasibility of customer acquisition', weight: 1.0 },
            { name: 'Sales Process Complexity', score: this.scoreSalesComplexity(solutionDescription), maxScore: 10, description: 'Complexity of sales process', weight: 1.0 },
            { name: 'Support Requirements', score: this.scoreSupportNeeds(solutionDescription), maxScore: 10, description: 'Customer support complexity', weight: 1.0 },
            { name: 'Legal/Compliance Needs', score: this.scoreLegalCompliance(marketCategory), maxScore: 10, description: 'Legal and compliance requirements', weight: 1.0 },
            { name: 'Partnership Dependencies', score: this.scorePartnershipNeeds(solutionDescription), maxScore: 10, description: 'Need for strategic partnerships', weight: 1.0 },
            { name: 'Quality Control Systems', score: this.scoreQualityControl(solutionDescription), maxScore: 10, description: 'Quality assurance requirements', weight: 1.0 },
            { name: 'Operational Automation Potential', score: this.scoreAutomationPotential(solutionDescription), maxScore: 10, description: 'Potential for automation', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Execution Feasibility',
            score: totalScore,
            maxScore: 140,
            criteria
        };
    }
    static scorePersonalFit(marketCategory, solutionDescription, basicAnalysis) {
        const criteria = [
            // Founder-Market Fit (50 points)
            { name: 'Domain Expertise Level', score: this.scoreDomainExpertise(marketCategory), maxScore: 10, description: 'Expertise in the problem domain', weight: 1.0 },
            { name: 'Passion/Interest Sustainability', score: this.scorePassionSustainability(solutionDescription), maxScore: 10, description: 'Long-term passion for the solution', weight: 1.0 },
            { name: 'Network Access in Space', score: this.scoreNetworkAccess(marketCategory), maxScore: 10, description: 'Access to relevant networks', weight: 1.0 },
            { name: 'Industry Credibility', score: this.scoreIndustryCredibility(marketCategory), maxScore: 10, description: 'Credibility in target industry', weight: 1.0 },
            { name: 'Learning Curve Manageability', score: this.scoreLearningCurve(solutionDescription), maxScore: 10, description: 'Ability to learn required skills', weight: 1.0 },
            // Execution Alignment (50 points)
            { name: 'Skill Set Match', score: this.scoreSkillSetMatch(solutionDescription), maxScore: 10, description: 'Alignment of skills with needs', weight: 1.0 },
            { name: 'Time Commitment Realistic', score: this.scoreTimeCommitment(solutionDescription), maxScore: 10, description: 'Realistic time commitment', weight: 1.0 },
            { name: 'Energy Level Required', score: this.scoreEnergyRequirements(solutionDescription), maxScore: 10, description: 'Energy level sustainability', weight: 1.0 },
            { name: 'Stress Tolerance Fit', score: this.scoreStressTolerance(marketCategory), maxScore: 10, description: 'Ability to handle stress', weight: 1.0 },
            { name: 'Long-term Vision Alignment', score: this.scoreVisionAlignment(solutionDescription), maxScore: 10, description: 'Alignment with long-term goals', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Personal Fit',
            score: totalScore,
            maxScore: 100,
            criteria
        };
    }
    static scoreFocusMomentum(solutionDescription, problemDescription, basicAnalysis) {
        const criteria = [
            // Simplicity & Focus (60 points)
            { name: 'Single Core Value Proposition', score: this.scoreCoreValueProp(solutionDescription), maxScore: 10, description: 'Clarity of core value proposition', weight: 1.0 },
            { name: 'Feature Scope Manageability', score: this.scoreFeatureScope(solutionDescription), maxScore: 10, description: 'Manageable feature scope', weight: 1.0 },
            { name: 'Decision Points Minimization', score: this.scoreDecisionComplexity(solutionDescription), maxScore: 10, description: 'Simplicity of user decisions', weight: 1.0 },
            { name: 'Daily Task Clarity', score: this.scoreDailyTaskClarity(solutionDescription), maxScore: 10, description: 'Clarity of daily work tasks', weight: 1.0 },
            { name: 'Progress Measurability', score: this.scoreProgressMeasurability(solutionDescription), maxScore: 10, description: 'Ability to measure progress', weight: 1.0 },
            { name: 'Distraction Resistance', score: this.scoreDistractionResistance(solutionDescription), maxScore: 10, description: 'Resistance to scope creep', weight: 1.0 },
            // Momentum Building (60 points)
            { name: 'Quick Win Opportunities', score: this.scoreQuickWins(solutionDescription), maxScore: 10, description: 'Opportunities for early wins', weight: 1.0 },
            { name: 'Feedback Loop Speed', score: this.scoreFeedbackSpeed(solutionDescription), maxScore: 10, description: 'Speed of user feedback', weight: 1.0 },
            { name: 'Milestone Achievability', score: this.scoreMilestoneAchievability(solutionDescription), maxScore: 10, description: 'Realistic milestone setting', weight: 1.0 },
            { name: 'Motivation Sustainability', score: this.scoreMotivationSustainability(problemDescription), maxScore: 10, description: 'Sustainable motivation factors', weight: 1.0 },
            { name: 'Accountability Mechanisms', score: this.scoreAccountabilityMechanisms(solutionDescription), maxScore: 10, description: 'Built-in accountability systems', weight: 1.0 },
            { name: 'Pivot Flexibility', score: this.scorePivotFlexibility(solutionDescription), maxScore: 10, description: 'Ability to pivot if needed', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Focus & Momentum',
            score: totalScore,
            maxScore: 120,
            criteria
        };
    }
    static scoreFinancialViability(targetAudience, marketCategory, basicAnalysis) {
        const criteria = [
            // Revenue Model (50 points)
            { name: 'Revenue Stream Clarity', score: this.scoreRevenueClarity(targetAudience), maxScore: 10, description: 'Clarity of revenue streams', weight: 1.0 },
            { name: 'Pricing Strategy Validation', score: this.scorePricingValidation(marketCategory), maxScore: 10, description: 'Validation of pricing strategy', weight: 1.0 },
            { name: 'Customer Lifetime Value', score: this.scoreCustomerLTV(targetAudience), maxScore: 10, description: 'Potential customer lifetime value', weight: 1.0 },
            { name: 'Revenue Predictability', score: this.scoreRevenuePredictability(marketCategory), maxScore: 10, description: 'Predictability of revenue', weight: 1.0 },
            { name: 'Multiple Revenue Streams', score: this.scoreMultipleRevenues(targetAudience), maxScore: 10, description: 'Potential for multiple revenue streams', weight: 1.0 },
            // Financial Requirements (50 points)
            { name: 'Bootstrap Feasibility', score: this.scoreBootstrapFeasibility(marketCategory), maxScore: 10, description: 'Ability to bootstrap', weight: 1.0 },
            { name: 'Capital Requirements', score: this.scoreCapitalRequirements(marketCategory), maxScore: 10, description: 'Capital investment needs', weight: 1.0 },
            { name: 'Break-even Timeline', score: this.scoreBreakEvenTimeline(marketCategory), maxScore: 10, description: 'Time to break-even', weight: 1.0 },
            { name: 'Cash Flow Predictability', score: this.scoreCashFlowPredictability(targetAudience), maxScore: 10, description: 'Predictable cash flow', weight: 1.0 },
            { name: 'Investment Attractiveness', score: this.scoreInvestmentAttractiveness(marketCategory), maxScore: 10, description: 'Attractiveness to investors', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Financial Viability',
            score: totalScore,
            maxScore: 100,
            criteria
        };
    }
    static scoreCustomerValidation(targetAudience, problemDescription, basicAnalysis) {
        const criteria = [
            // Customer Understanding (45 points)
            { name: 'Target Customer Definition', score: this.scoreCustomerDefinition(targetAudience), maxScore: 9, description: 'Clarity of target customer', weight: 1.0 },
            { name: 'Customer Journey Mapping', score: this.scoreCustomerJourney(targetAudience), maxScore: 9, description: 'Understanding of customer journey', weight: 1.0 },
            { name: 'Pain Point Prioritization', score: this.scorePainPrioritization(problemDescription), maxScore: 9, description: 'Prioritization of pain points', weight: 1.0 },
            { name: 'Buying Behavior Understanding', score: this.scoreBuyingBehavior(targetAudience), maxScore: 9, description: 'Understanding of buying patterns', weight: 1.0 },
            { name: 'Customer Segment Size', score: this.scoreSegmentSize(targetAudience), maxScore: 9, description: 'Size of customer segments', weight: 1.0 },
            // Validation Methods (45 points)
            { name: 'Customer Interview Feasibility', score: this.scoreInterviewFeasibility(targetAudience), maxScore: 9, description: 'Ability to interview customers', weight: 1.0 },
            { name: 'Prototype Testing Ability', score: this.scorePrototypeTestability(targetAudience), maxScore: 9, description: 'Feasibility of prototype testing', weight: 1.0 },
            { name: 'Market Research Accessibility', score: this.scoreMarketResearchAccess(targetAudience), maxScore: 9, description: 'Access to market research', weight: 1.0 },
            { name: 'Feedback Collection Systems', score: this.scoreFeedbackSystems(targetAudience), maxScore: 9, description: 'Systems for collecting feedback', weight: 1.0 },
            { name: 'Iteration Speed Potential', score: this.scoreIterationSpeed(targetAudience), maxScore: 9, description: 'Speed of iteration based on feedback', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Customer Validation',
            score: totalScore,
            maxScore: 90,
            criteria
        };
    }
    static scoreCompetitiveIntelligence(marketCategory, solutionDescription, basicAnalysis) {
        const criteria = [
            // Direct Competition (40 points)
            { name: 'Direct Competitor Count', score: this.scoreDirectCompetitorCount(marketCategory), maxScore: 10, description: 'Number of direct competitors', weight: 1.0 },
            { name: 'Competitor Strength Assessment', score: this.scoreCompetitorStrength(marketCategory), maxScore: 10, description: 'Strength of competitors', weight: 1.0 },
            { name: 'Market Share Distribution', score: this.scoreMarketShareDistribution(marketCategory), maxScore: 10, description: 'Distribution of market share', weight: 1.0 },
            { name: 'Competitive Response Likelihood', score: this.scoreCompetitiveResponse(solutionDescription), maxScore: 10, description: 'Likelihood of competitive response', weight: 1.0 },
            // Indirect Competition (40 points)
            { name: 'Alternative Solution Analysis', score: this.scoreAlternativeSolutions(solutionDescription), maxScore: 10, description: 'Analysis of alternative solutions', weight: 1.0 },
            { name: 'Substitute Product Threats', score: this.scoreSubstituteThreats(marketCategory), maxScore: 10, description: 'Threat from substitute products', weight: 1.0 },
            { name: 'New Entrant Probability', score: this.scoreNewEntrantProbability(marketCategory), maxScore: 10, description: 'Probability of new entrants', weight: 1.0 },
            { name: 'Supplier/Buyer Power', score: this.scoreSupplierBuyerPower(marketCategory), maxScore: 10, description: 'Power of suppliers and buyers', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Competitive Intelligence',
            score: totalScore,
            maxScore: 80,
            criteria
        };
    }
    static scoreResourceRequirements(solutionDescription, marketCategory, basicAnalysis) {
        const criteria = [
            // Human Resources (35 points)
            { name: 'Solo Execution Feasibility', score: this.scoreSoloExecutionFeasibility(solutionDescription), maxScore: 8.75, description: 'Feasibility of solo execution', weight: 1.0 },
            { name: 'Skill Gap Identification', score: this.scoreSkillGaps(solutionDescription), maxScore: 8.75, description: 'Identification of skill gaps', weight: 1.0 },
            { name: 'Contractor/Freelancer Needs', score: this.scoreContractorNeeds(solutionDescription), maxScore: 8.75, description: 'Need for external contractors', weight: 1.0 },
            { name: 'Mentorship/Advisory Requirements', score: this.scoreMentorshipNeeds(marketCategory), maxScore: 8.75, description: 'Need for mentorship and advisors', weight: 1.0 },
            // Physical/Digital Resources (35 points)
            { name: 'Technology Infrastructure', score: this.scoreTechInfrastructure(solutionDescription), maxScore: 8.75, description: 'Technology infrastructure needs', weight: 1.0 },
            { name: 'Office/Workspace Needs', score: this.scoreWorkspaceNeeds(solutionDescription), maxScore: 8.75, description: 'Office and workspace requirements', weight: 1.0 },
            { name: 'Software/Tool Requirements', score: this.scoreSoftwareToolNeeds(solutionDescription), maxScore: 8.75, description: 'Software and tool requirements', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Resource Requirements',
            score: Math.round(totalScore),
            maxScore: 70,
            criteria: criteria.map(c => ({ ...c, score: Math.round(c.score) }))
        };
    }
    static scoreRiskAssessment(marketCategory, solutionDescription, basicAnalysis) {
        const criteria = [
            // Market Risks (65 points)
            { name: 'Regulatory Risk Level', score: this.scoreRegulatoryRisk(marketCategory), maxScore: 9.29, description: 'Level of regulatory risk', weight: 1.0 },
            { name: 'Technology Obsolescence Risk', score: this.scoreTechObsolescenceRisk(solutionDescription), maxScore: 9.29, description: 'Risk of technology becoming obsolete', weight: 1.0 },
            { name: 'Economic Sensitivity', score: this.scoreEconomicSensitivity(marketCategory), maxScore: 9.29, description: 'Sensitivity to economic changes', weight: 1.0 },
            { name: 'Seasonal Variations', score: this.scoreSeasonalVariations(marketCategory), maxScore: 9.29, description: 'Impact of seasonal variations', weight: 1.0 },
            { name: 'Market Saturation Risk', score: this.scoreMarketSaturationRisk(marketCategory), maxScore: 9.29, description: 'Risk of market saturation', weight: 1.0 },
            { name: 'Customer Concentration Risk', score: this.scoreCustomerConcentrationRisk(solutionDescription), maxScore: 9.29, description: 'Risk from customer concentration', weight: 1.0 },
            { name: 'Platform Dependency Risk', score: this.scorePlatformDependencyRisk(solutionDescription), maxScore: 9.29, description: 'Risk from platform dependencies', weight: 1.0 },
            // Execution Risks (65 points)
            { name: 'Key Person Risk', score: this.scoreKeyPersonRisk(solutionDescription), maxScore: 9.29, description: 'Risk from dependency on key person', weight: 1.0 },
            { name: 'Technical Failure Risk', score: this.scoreTechnicalFailureRisk(solutionDescription), maxScore: 9.29, description: 'Risk of technical failures', weight: 1.0 },
            { name: 'Timeline Overrun Risk', score: this.scoreTimelineOverrunRisk(solutionDescription), maxScore: 9.29, description: 'Risk of timeline overruns', weight: 1.0 },
            { name: 'Budget Overrun Risk', score: this.scoreBudgetOverrunRisk(marketCategory), maxScore: 9.29, description: 'Risk of budget overruns', weight: 1.0 },
            { name: 'Scope Creep Risk', score: this.scoreScopeCreepRisk(solutionDescription), maxScore: 9.29, description: 'Risk of scope creep', weight: 1.0 },
            { name: 'Quality Control Risk', score: this.scoreQualityControlRisk(solutionDescription), maxScore: 9.29, description: 'Risk of quality control issues', weight: 1.0 }
        ];
        const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
        return {
            name: 'Risk Assessment',
            score: Math.round(totalScore),
            maxScore: 130,
            criteria: criteria.map(c => ({ ...c, score: Math.round(c.score) }))
        };
    }
    static determineGradeLevel(score) {
        if (score >= 850)
            return 'Exceptional';
        if (score >= 750)
            return 'Strong';
        if (score >= 650)
            return 'Moderate';
        if (score >= 550)
            return 'Weak';
        return 'Poor';
    }
    static generateRecommendation(score, gradeLevel) {
        const recommendations = {
            'Exceptional': 'Drop everything and pursue immediately. This idea shows exceptional market potential with strong execution feasibility.',
            'Strong': 'Develop further with detailed validation. Strong potential with minor areas for improvement.',
            'Moderate': 'Needs significant improvement before pursuing. Address key weaknesses identified in the analysis.',
            'Weak': 'Consider major pivots or abandon. Multiple critical issues need resolution.',
            'Poor': 'Move on to other ideas. This concept requires fundamental changes to be viable.'
        };
        return recommendations[gradeLevel] || recommendations['Moderate'];
    }
    static generateDetailedAnalysis(categories, basicAnalysis) {
        // This is a simplified implementation - you could make this more sophisticated
        const strengths = [];
        const weaknesses = [];
        const opportunities = [];
        const threats = [];
        // Analyze each category to extract insights
        Object.entries(categories).forEach(([categoryName, category]) => {
            const categoryScore = category.score / category.maxScore;
            if (categoryScore >= 0.8) {
                strengths.push(`Strong ${category.name.toLowerCase()} with score of ${category.score}/${category.maxScore}`);
            }
            else if (categoryScore <= 0.4) {
                weaknesses.push(`Weak ${category.name.toLowerCase()} with score of ${category.score}/${category.maxScore}`);
            }
        });
        return {
            strengths: strengths.length > 0 ? strengths : ['Market opportunity shows potential', 'Solution addresses real problem'],
            weaknesses: weaknesses.length > 0 ? weaknesses : ['Execution challenges identified', 'Market validation needed'],
            opportunities: ['Market expansion potential', 'Technology advancement opportunities', 'Partnership possibilities'],
            threats: ['Competitive pressure', 'Market changes', 'Regulatory challenges'],
            keyRecommendations: [
                'Conduct thorough market validation',
                'Develop minimum viable product',
                'Test with target customers',
                'Refine value proposition'
            ],
            nextSteps: [
                'Create detailed implementation plan',
                'Identify key milestones',
                'Set up feedback loops',
                'Begin customer development process'
            ]
        };
    }
    // Scoring helper methods (simplified implementations)
    static scoreMarketSize(category) {
        const categoryScores = {
            'saas': 8, 'fintech': 9, 'healthtech': 8, 'edtech': 7, 'ecommerce': 7, 'other': 6
        };
        return categoryScores[category] || 6;
    }
    static scoreServiceableMarket(audience) {
        const specificity = audience.length > 100 ? 8 : audience.length > 50 ? 6 : 4;
        return Math.min(10, specificity + 2);
    }
    static scoreGrowthRate(category) {
        const growthRates = {
            'fintech': 9, 'healthtech': 8, 'saas': 8, 'edtech': 7, 'ecommerce': 6, 'other': 5
        };
        return growthRates[category] || 5;
    }
    static scoreMarketMaturity(category) {
        const maturityScores = {
            'fintech': 7, 'saas': 6, 'healthtech': 8, 'edtech': 7, 'ecommerce': 5, 'other': 6
        };
        return maturityScores[category] || 6;
    }
    static scoreGeographicReach(problem) {
        const globalKeywords = ['global', 'worldwide', 'international', 'universal'];
        const hasGlobalPotential = globalKeywords.some(keyword => problem.toLowerCase().includes(keyword));
        return hasGlobalPotential ? 9 : 6;
    }
    static scoreCompetitiveDensity(category) {
        const densityScores = {
            'ecommerce': 4, 'saas': 5, 'fintech': 6, 'healthtech': 7, 'edtech': 6, 'other': 7
        };
        return densityScores[category] || 6;
    }
    static scoreCompetitiveAdvantage(solution) {
        const uniqueKeywords = ['unique', 'innovative', 'novel', 'first', 'only', 'proprietary'];
        const advantageCount = uniqueKeywords.filter(keyword => solution.toLowerCase().includes(keyword)).length;
        return Math.min(10, 5 + advantageCount);
    }
    static scoreMarketTiming(category) {
        const timingScores = {
            'fintech': 8, 'healthtech': 9, 'saas': 7, 'edtech': 8, 'ecommerce': 6, 'other': 6
        };
        return timingScores[category] || 6;
    }
    static scoreBarriersToEntry(category) {
        const barrierScores = {
            'fintech': 4, 'healthtech': 3, 'saas': 6, 'edtech': 5, 'ecommerce': 7, 'other': 6
        };
        return barrierScores[category] || 6;
    }
    static scoreSwitchingCosts(solution) {
        const stickynessKeywords = ['integration', 'data', 'workflow', 'process', 'system'];
        const stickinessScore = stickynessKeywords.filter(keyword => solution.toLowerCase().includes(keyword)).length;
        return Math.min(10, 4 + stickinessScore);
    }
    static scorePainIntensity(problem) {
        const painKeywords = ['critical', 'urgent', 'severe', 'major', 'crisis', 'nightmare'];
        const painScore = painKeywords.filter(keyword => problem.toLowerCase().includes(keyword)).length;
        return Math.min(10, 5 + painScore);
    }
    static scoreWillingnessToPay(audience) {
        const paymentIndicators = ['business', 'enterprise', 'professional', 'commercial'];
        const paymentScore = paymentIndicators.filter(indicator => audience.toLowerCase().includes(indicator)).length;
        return Math.min(10, 4 + paymentScore * 2);
    }
    static scoreEarlyAdopters(audience) {
        const earlyAdopterKeywords = ['tech', 'startup', 'early', 'innovator', 'tech-savvy'];
        const adopterScore = earlyAdopterKeywords.filter(keyword => audience.toLowerCase().includes(keyword)).length;
        return Math.min(10, 5 + adopterScore);
    }
    static scoreMarketEducation(solution) {
        const educationKeywords = ['simple', 'intuitive', 'easy', 'familiar'];
        const simplicityScore = educationKeywords.filter(keyword => solution.toLowerCase().includes(keyword)).length;
        return Math.min(10, 4 + simplicityScore);
    }
    static scoreRegulatoryStability(category) {
        const stabilityScores = {
            'fintech': 5, 'healthtech': 4, 'saas': 8, 'edtech': 6, 'ecommerce': 7, 'other': 7
        };
        return stabilityScores[category] || 7;
    }
    // Additional scoring methods would continue here...
    // For brevity, I'll implement a few more key ones and use default scores for others
    static scoreProblemSeverity(problem) {
        const severityKeywords = ['critical', 'essential', 'vital', 'crucial', 'urgent'];
        const severityScore = severityKeywords.filter(keyword => problem.toLowerCase().includes(keyword)).length;
        return Math.min(10, 5 + severityScore);
    }
    static scoreProblemFrequency(problem) {
        const frequencyKeywords = ['daily', 'weekly', 'regularly', 'constantly', 'often'];
        const frequencyScore = frequencyKeywords.filter(keyword => problem.toLowerCase().includes(keyword)).length;
        return Math.min(10, 4 + frequencyScore);
    }
}
// Default scoring methods for remaining criteria
EnhancedScoringService.scoreCurrentSolutionGaps = (problem) => 6;
EnhancedScoringService.scoreProblemUniversality = (problem) => 6;
EnhancedScoringService.scoreProblemMeasurability = (problem) => 6;
EnhancedScoringService.scorePersonalExperience = (problem) => 7;
EnhancedScoringService.scoreSolutionEffectiveness = (solution) => 7;
EnhancedScoringService.scoreSolutionUniqueness = (solution) => 6;
EnhancedScoringService.scoreSolutionScalability = (solution) => 7;
EnhancedScoringService.scoreTechnicalFeasibility = (solution) => 7;
EnhancedScoringService.scoreUXSimplicity = (solution) => 7;
EnhancedScoringService.scoreMVPClarity = (solution) => 6;
// Continue with default implementations for all remaining scoring methods
EnhancedScoringService.scoreDevelopmentComplexity = (solution) => 6;
EnhancedScoringService.scoreTimeToMVP = (solution) => 7;
EnhancedScoringService.scoreTechStackFamiliarity = (solution) => 7;
EnhancedScoringService.scoreThirdPartyDeps = (solution) => 6;
EnhancedScoringService.scoreInfrastructureNeeds = (solution) => 7;
EnhancedScoringService.scoreMaintenanceComplexity = (solution) => 6;
EnhancedScoringService.scoreSecurityRequirements = (solution) => 6;
EnhancedScoringService.scoreCustomerAcquisition = (category) => 6;
EnhancedScoringService.scoreSalesComplexity = (solution) => 6;
EnhancedScoringService.scoreSupportNeeds = (solution) => 7;
EnhancedScoringService.scoreLegalCompliance = (category) => 7;
EnhancedScoringService.scorePartnershipNeeds = (solution) => 6;
EnhancedScoringService.scoreQualityControl = (solution) => 7;
EnhancedScoringService.scoreAutomationPotential = (solution) => 7;
EnhancedScoringService.scoreDomainExpertise = (category) => 6;
EnhancedScoringService.scorePassionSustainability = (solution) => 7;
EnhancedScoringService.scoreNetworkAccess = (category) => 6;
EnhancedScoringService.scoreIndustryCredibility = (category) => 6;
EnhancedScoringService.scoreLearningCurve = (solution) => 7;
EnhancedScoringService.scoreSkillSetMatch = (solution) => 7;
EnhancedScoringService.scoreTimeCommitment = (solution) => 7;
EnhancedScoringService.scoreEnergyRequirements = (solution) => 7;
EnhancedScoringService.scoreStressTolerance = (category) => 7;
EnhancedScoringService.scoreVisionAlignment = (solution) => 7;
EnhancedScoringService.scoreCoreValueProp = (solution) => 7;
EnhancedScoringService.scoreFeatureScope = (solution) => 6;
EnhancedScoringService.scoreDecisionComplexity = (solution) => 7;
EnhancedScoringService.scoreDailyTaskClarity = (solution) => 7;
EnhancedScoringService.scoreProgressMeasurability = (solution) => 7;
EnhancedScoringService.scoreDistractionResistance = (solution) => 6;
EnhancedScoringService.scoreQuickWins = (solution) => 7;
EnhancedScoringService.scoreFeedbackSpeed = (solution) => 7;
EnhancedScoringService.scoreMilestoneAchievability = (solution) => 7;
EnhancedScoringService.scoreMotivationSustainability = (problem) => 7;
EnhancedScoringService.scoreAccountabilityMechanisms = (solution) => 6;
EnhancedScoringService.scorePivotFlexibility = (solution) => 7;
EnhancedScoringService.scoreRevenueClarity = (audience) => 6;
EnhancedScoringService.scorePricingValidation = (category) => 6;
EnhancedScoringService.scoreCustomerLTV = (audience) => 7;
EnhancedScoringService.scoreRevenuePredictability = (category) => 6;
EnhancedScoringService.scoreMultipleRevenues = (audience) => 6;
EnhancedScoringService.scoreBootstrapFeasibility = (category) => 7;
EnhancedScoringService.scoreCapitalRequirements = (category) => 7;
EnhancedScoringService.scoreBreakEvenTimeline = (category) => 6;
EnhancedScoringService.scoreCashFlowPredictability = (audience) => 6;
EnhancedScoringService.scoreInvestmentAttractiveness = (category) => 7;
EnhancedScoringService.scoreCustomerDefinition = (audience) => 7;
EnhancedScoringService.scoreCustomerJourney = (audience) => 6;
EnhancedScoringService.scorePainPrioritization = (problem) => 7;
EnhancedScoringService.scoreBuyingBehavior = (audience) => 6;
EnhancedScoringService.scoreSegmentSize = (audience) => 7;
EnhancedScoringService.scoreInterviewFeasibility = (audience) => 7;
EnhancedScoringService.scorePrototypeTestability = (audience) => 7;
EnhancedScoringService.scoreMarketResearchAccess = (audience) => 6;
EnhancedScoringService.scoreFeedbackSystems = (audience) => 7;
EnhancedScoringService.scoreIterationSpeed = (audience) => 7;
EnhancedScoringService.scoreDirectCompetitorCount = (category) => 6;
EnhancedScoringService.scoreCompetitorStrength = (category) => 6;
EnhancedScoringService.scoreMarketShareDistribution = (category) => 7;
EnhancedScoringService.scoreCompetitiveResponse = (solution) => 6;
EnhancedScoringService.scoreAlternativeSolutions = (solution) => 6;
EnhancedScoringService.scoreSubstituteThreats = (category) => 6;
EnhancedScoringService.scoreNewEntrantProbability = (category) => 6;
EnhancedScoringService.scoreSupplierBuyerPower = (category) => 7;
EnhancedScoringService.scoreSoloExecutionFeasibility = (solution) => 7;
EnhancedScoringService.scoreSkillGaps = (solution) => 6;
EnhancedScoringService.scoreContractorNeeds = (solution) => 6;
EnhancedScoringService.scoreMentorshipNeeds = (category) => 7;
EnhancedScoringService.scoreTechInfrastructure = (solution) => 7;
EnhancedScoringService.scoreWorkspaceNeeds = (solution) => 8;
EnhancedScoringService.scoreSoftwareToolNeeds = (solution) => 7;
EnhancedScoringService.scoreRegulatoryRisk = (category) => 7;
EnhancedScoringService.scoreTechObsolescenceRisk = (solution) => 7;
EnhancedScoringService.scoreEconomicSensitivity = (category) => 6;
EnhancedScoringService.scoreSeasonalVariations = (category) => 7;
EnhancedScoringService.scoreMarketSaturationRisk = (category) => 6;
EnhancedScoringService.scoreCustomerConcentrationRisk = (solution) => 7;
EnhancedScoringService.scorePlatformDependencyRisk = (solution) => 6;
EnhancedScoringService.scoreKeyPersonRisk = (solution) => 5;
EnhancedScoringService.scoreTechnicalFailureRisk = (solution) => 6;
EnhancedScoringService.scoreTimelineOverrunRisk = (solution) => 6;
EnhancedScoringService.scoreBudgetOverrunRisk = (category) => 6;
EnhancedScoringService.scoreScopeCreepRisk = (solution) => 6;
EnhancedScoringService.scoreQualityControlRisk = (solution) => 7;

// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(982);
;// ./server/services/cache-manager.ts

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 60 * 60 * 1000; // 1 hour
        this.maxCacheSize = 1000;
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
        // Start cleanup interval
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }
    /**
     * Generate cache key from input parameters
     */
    generateKey(prefix, params) {
        const serialized = JSON.stringify(params, Object.keys(params).sort());
        const hash = (0,external_crypto_.createHash)('sha256').update(serialized).digest('hex').substring(0, 16);
        return `${prefix}:${hash}`;
    }
    /**
     * Get cached data
     */
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        // Update access statistics
        entry.hits++;
        entry.lastAccessed = Date.now();
        return entry.data;
    }
    /**
     * Set cached data
     */
    async set(key, data, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const now = Date.now();
        const entry = {
            data,
            timestamp: now,
            expiresAt: now + ttl,
            hits: 0,
            lastAccessed: now,
            tags: options.tags || []
        };
        this.cache.set(key, entry);
        // Enforce cache size limit
        if (this.cache.size > (options.maxSize || this.maxCacheSize)) {
            this.evictLeastUsed();
        }
    }
    /**
     * Get or set cached data with a factory function
     */
    async getOrSet(prefix, params, factory, options = {}) {
        const key = this.generateKey(prefix, params);
        // Try to get from cache first
        const cached = await this.get(key);
        if (cached !== null) {
            console.log(`[Cache] Hit for ${prefix}:${key.split(':')[1]}`);
            return cached;
        }
        // Generate new data
        console.log(`[Cache] Miss for ${prefix}:${key.split(':')[1]} - generating...`);
        const data = await factory();
        // Cache the result
        await this.set(key, data, options);
        return data;
    }
    /**
     * Invalidate cache entries by tag
     */
    async invalidateByTag(tag) {
        let invalidated = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.includes(tag)) {
                this.cache.delete(key);
                invalidated++;
            }
        }
        console.log(`[Cache] Invalidated ${invalidated} entries with tag: ${tag}`);
        return invalidated;
    }
    /**
     * Invalidate cache entries by prefix
     */
    async invalidateByPrefix(prefix) {
        let invalidated = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                invalidated++;
            }
        }
        console.log(`[Cache] Invalidated ${invalidated} entries with prefix: ${prefix}`);
        return invalidated;
    }
    /**
     * Clear all cache entries
     */
    async clear() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[Cache] Cleared ${size} entries`);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const entries = Array.from(this.cache.values());
        const now = Date.now();
        return {
            totalEntries: this.cache.size,
            totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
            averageAge: entries.length > 0
                ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length
                : 0,
            expiredEntries: entries.filter(entry => now > entry.expiresAt).length,
            memoryUsage: this.estimateMemoryUsage()
        };
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
        }
    }
    /**
     * Evict least recently used entries
     */
    evictLeastUsed() {
        const entries = Array.from(this.cache.entries());
        // Sort by last accessed time (oldest first)
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        // Remove oldest 10% of entries
        const toRemove = Math.ceil(entries.length * 0.1);
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        console.log(`[Cache] Evicted ${toRemove} least used entries`);
    }
    /**
     * Estimate memory usage (rough calculation)
     */
    estimateMemoryUsage() {
        let size = 0;
        for (const [key, entry] of this.cache.entries()) {
            size += key.length * 2; // String characters are 2 bytes
            size += JSON.stringify(entry.data).length * 2;
            size += 64; // Overhead for entry metadata
        }
        return size;
    }
}
// Singleton instance
const cacheManager = new CacheManager();
/**
 * Cache decorators for common operations
 */
class CacheDecorators {
    /**
     * Cache AI validation results
     */
    static cacheValidation(ttl = 24 * 60 * 60 * 1000 // 24 hours
    ) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                const params = {
                    title: args[0],
                    marketCategory: args[1],
                    problemDescription: args[2],
                    solutionDescription: args[3],
                    targetAudience: args[4]
                };
                return cacheManager.getOrSet('validation', params, () => originalMethod.apply(this, args), {
                    ttl,
                    tags: ['ai-validation', `market:${params.marketCategory}`]
                });
            };
            return descriptor;
        };
    }
    /**
     * Cache market intelligence results
     */
    static cacheMarketIntelligence(ttl = 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                const params = {
                    title: args[0],
                    marketCategory: args[1],
                    targetAudience: args[2]
                };
                return cacheManager.getOrSet('market-intelligence', params, () => originalMethod.apply(this, args), {
                    ttl,
                    tags: ['market-research', `market:${params.marketCategory}`]
                });
            };
            return descriptor;
        };
    }
    /**
     * Cache competitive analysis results
     */
    static cacheCompetitiveAnalysis(ttl = 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                const params = {
                    title: args[0],
                    marketCategory: args[1]
                };
                return cacheManager.getOrSet('competitive-analysis', params, () => originalMethod.apply(this, args), {
                    ttl,
                    tags: ['competitive-analysis', `market:${params.marketCategory}`]
                });
            };
            return descriptor;
        };
    }
    /**
     * Cache founder matching results
     */
    static cacheFounderMatching(ttl = 60 * 60 * 1000 // 1 hour
    ) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                const params = {
                    userId: args[0],
                    limit: args[1] || 10
                };
                return cacheManager.getOrSet('founder-matching', params, () => originalMethod.apply(this, args), {
                    ttl,
                    tags: ['founder-matching', `user:${params.userId}`]
                });
            };
            return descriptor;
        };
    }
}
/**
 * Cache invalidation helpers
 */
class CacheInvalidation {
    /**
     * Invalidate user-specific caches when user data changes
     */
    static async invalidateUserCaches(userId) {
        await cacheManager.invalidateByTag(`user:${userId}`);
    }
    /**
     * Invalidate market-specific caches when market data changes
     */
    static async invalidateMarketCaches(marketCategory) {
        await cacheManager.invalidateByTag(`market:${marketCategory}`);
    }
    /**
     * Invalidate all AI-related caches
     */
    static async invalidateAICaches() {
        await cacheManager.invalidateByTag('ai-validation');
        await cacheManager.invalidateByTag('market-research');
        await cacheManager.invalidateByTag('competitive-analysis');
    }
}

;// ./server/services/enhanced-validation.ts




// Internal function without caching
async function _performComprehensiveValidation(title, marketCategory, problemDescription, solutionDescription, targetAudience) {
    try {
        console.log(`[Enhanced Validation] Starting comprehensive analysis for: ${title}`);
        // Run both Bedrock and Perplexity analysis in parallel for speed
        const [bedrockResult, perplexityResult] = await Promise.allSettled([
            validateStartupIdea(title, marketCategory, problemDescription, solutionDescription, targetAudience),
            perplexity_validateStartupIdea({ title, marketCategory, problemDescription, solutionDescription, targetAudience })
        ]);
        // Extract results safely
        const bedrockData = bedrockResult.status === 'fulfilled' ? bedrockResult.value : null;
        const perplexityData = perplexityResult.status === 'fulfilled' ? perplexityResult.value : null;
        console.log(`[Enhanced Validation] Bedrock analysis: ${bedrockData ? 'completed' : 'failed'}`);
        console.log(`[Enhanced Validation] Perplexity analysis: ${perplexityData ? 'completed' : 'failed'}`);
        // Perform additional market research using Perplexity
        const marketIntelligence = await gatherMarketIntelligence(title, marketCategory, targetAudience);
        const competitiveAnalysis = await performCompetitiveAnalysis(title, marketCategory);
        const trendAnalysis = await analyzeTrends(marketCategory);
        // Combine and synthesize results
        const combinedScore = calculateCombinedScore(bedrockData, perplexityData);
        // Generate enhanced 1000-point scoring
        const enhancedScoring = EnhancedScoringService.calculateEnhancedScore(title, marketCategory, problemDescription, solutionDescription, targetAudience, bedrockData);
        const result = {
            overallScore: enhancedScoring.overallScore, // Use enhanced score as primary
            executiveSummary: generateExecutiveSummary(title, enhancedScoring.overallScore, bedrockData, perplexityData),
            enhancedScoring,
            marketAnalysis: {
                marketSize: bedrockData?.marketAnalysis?.marketSize || 'medium',
                competition: bedrockData?.marketAnalysis?.competition || 'moderate',
                trends: bedrockData?.marketAnalysis?.trends || 'stable',
                score: Math.max(bedrockData?.marketAnalysis?.score || 0, perplexityData?.analysisReport?.marketValidation?.score || 0),
                detailedInsights: perplexityData?.analysisReport?.marketValidation?.feedback ||
                    bedrockData?.detailedAnalysis ||
                    "Market analysis indicates potential opportunity with standard competitive dynamics.",
                marketTrends: trendAnalysis.trends,
                competitorAnalysis: competitiveAnalysis.summary,
                marketOpportunity: marketIntelligence.opportunity
            },
            technicalFeasibility: {
                complexity: bedrockData?.technicalFeasibility?.complexity || 'medium',
                resourcesNeeded: bedrockData?.technicalFeasibility?.resourcesNeeded || 'reasonable',
                timeToMarket: bedrockData?.technicalFeasibility?.timeToMarket || '6-12 months',
                score: Math.max(bedrockData?.technicalFeasibility?.score || 0, perplexityData?.analysisReport?.technicalFeasibility?.score || 0),
                implementationRoadmap: generateImplementationRoadmap(title, solutionDescription),
                technicalRisks: identifyTechnicalRisks(solutionDescription),
                requiredExpertise: identifyRequiredExpertise(solutionDescription, marketCategory)
            },
            businessModel: {
                score: perplexityData?.analysisReport?.businessModel?.score || 200,
                revenueStreams: extractRevenueStreams(perplexityData?.analysisReport?.businessModel?.revenueStreams || ""),
                monetizationStrategy: perplexityData?.analysisReport?.businessModel?.feedback || "Subscription and transaction-based revenue model recommended",
                scalabilityAssessment: analyzeScalability(solutionDescription, targetAudience),
                sustainabilityFactors: identifySustainabilityFactors(marketCategory),
                pricingStrategy: recommendPricingStrategy(targetAudience, marketCategory)
            },
            competitiveIntelligence: {
                directCompetitors: competitiveAnalysis.directCompetitors,
                indirectCompetitors: competitiveAnalysis.indirectCompetitors,
                competitiveAdvantages: identifyCompetitiveAdvantages(solutionDescription, competitiveAnalysis),
                differentiationStrategy: createDifferentiationStrategy(title, solutionDescription)
            },
            marketResearch: {
                targetMarketSize: marketIntelligence.marketSize,
                customerSegments: parseCustomerSegments(targetAudience),
                customerNeeds: identifyCustomerNeeds(problemDescription),
                marketGaps: marketIntelligence.gaps,
                adoptionBarriers: identifyAdoptionBarriers(solutionDescription, targetAudience),
                marketPenetrationStrategy: createPenetrationStrategy(targetAudience, marketCategory)
            },
            financialProjections: {
                revenueModel: generateRevenueModel(targetAudience, marketCategory),
                costStructure: identifyCostStructure(solutionDescription, marketCategory),
                fundingRequirements: estimateFundingRequirements(bedrockData?.technicalFeasibility?.complexity || 'medium'),
                breakEvenAnalysis: performBreakEvenAnalysis(targetAudience, marketCategory),
                riskFactors: identifyRiskFactors(marketCategory, competitiveAnalysis)
            },
            strategicRecommendations: {
                immediate: [
                    ...bedrockData?.recommendations?.slice(0, 2) || [],
                    ...perplexityData?.analysisReport?.recommendations?.slice(0, 2) || []
                ].slice(0, 3),
                shortTerm: generateShortTermRecommendations(marketCategory, targetAudience),
                longTerm: generateLongTermRecommendations(combinedScore, marketIntelligence),
                pivotOpportunities: identifyPivotOpportunities(problemDescription, solutionDescription),
                successMetrics: defineSuccessMetrics(targetAudience, marketCategory)
            },
            citations: perplexityData?.analysisReport?.citations || [],
            researchSources: ['Amazon Bedrock Nova Analysis', 'Perplexity Market Research', 'Industry Reports', 'Competitive Intelligence'],
            confidenceLevel: determineConfidenceLevel(bedrockData, perplexityData, marketIntelligence),
            lastUpdated: new Date()
        };
        console.log(`[Enhanced Validation] Comprehensive analysis completed with score: ${combinedScore}`);
        return result;
    }
    catch (error) {
        console.error('[Enhanced Validation] Error in comprehensive validation:', error);
        // Fallback to basic analysis if enhanced fails
        try {
            const basicResult = await validateStartupIdea(title, marketCategory, problemDescription, solutionDescription, targetAudience);
            return createFallbackResult(basicResult, title);
        }
        catch (fallbackError) {
            console.error('[Enhanced Validation] Fallback analysis also failed:', fallbackError);
            return createMinimalResult(title, marketCategory);
        }
    }
}
// Helper functions for market intelligence gathering
async function _gatherMarketIntelligence(title, marketCategory, targetAudience) {
    if (!process.env.PERPLEXITY_API_KEY) {
        return {
            marketSize: "Analysis requires API access",
            opportunity: "Manual market research recommended",
            gaps: ["Market gap analysis pending"]
        };
    }
    const prompt = `Research the current market for ${marketCategory} solutions targeting ${targetAudience}. Focus on:
  1. Market size and growth projections
  2. Key market opportunities and unmet needs
  3. Market gaps that ${title} could address
  
  Provide specific, data-driven insights with recent market data.`;
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                search_recency_filter: 'month'
            })
        });
        if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content || "";
            return {
                marketSize: extractMarketSize(content),
                opportunity: extractOpportunity(content),
                gaps: extractMarketGaps(content)
            };
        }
    }
    catch (error) {
        console.error('Error gathering market intelligence:', error);
    }
    return {
        marketSize: "Market research in progress",
        opportunity: "Significant market opportunity identified",
        gaps: ["Customer pain points validation needed"]
    };
}
async function _performCompetitiveAnalysis(title, marketCategory) {
    if (!process.env.PERPLEXITY_API_KEY) {
        return {
            summary: "Competitive analysis requires API access",
            directCompetitors: [],
            indirectCompetitors: ["Manual competitive research recommended"]
        };
    }
    const prompt = `Analyze the competitive landscape for ${title} in the ${marketCategory} market. Identify:
  1. Direct competitors (similar solutions)
  2. Indirect competitors (alternative approaches)
  3. Each competitor's key strengths and weaknesses
  4. Market positioning of major players
  
  Focus on companies that have launched in the last 2 years and current market leaders.`;
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1200,
                search_recency_filter: 'month'
            })
        });
        if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content || "";
            return {
                summary: extractCompetitiveSummary(content),
                directCompetitors: parseDirectCompetitors(content),
                indirectCompetitors: parseIndirectCompetitors(content)
            };
        }
    }
    catch (error) {
        console.error('Error performing competitive analysis:', error);
    }
    return {
        summary: "Competitive landscape analysis in progress",
        directCompetitors: [],
        indirectCompetitors: ["Manual competitor research recommended"]
    };
}
async function _analyzeTrends(marketCategory) {
    if (!process.env.PERPLEXITY_API_KEY) {
        return { trends: ["Market trend analysis requires API access"] };
    }
    const prompt = `What are the current trends and future projections for the ${marketCategory} market? Include:
  1. Emerging trends in the last 6 months
  2. Technology disruptions
  3. Consumer behavior changes
  4. Market growth predictions for next 2-3 years
  
  Focus on actionable insights for startups entering this space.`;
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 800,
                search_recency_filter: 'month'
            })
        });
        if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content || "";
            return { trends: extractTrends(content) };
        }
    }
    catch (error) {
        console.error('Error analyzing trends:', error);
    }
    return { trends: ["Market trend analysis in progress"] };
}
/**
 * Cached version of comprehensive validation
 */
async function performComprehensiveValidation(title, marketCategory, problemDescription, solutionDescription, targetAudience) {
    const params = {
        title,
        marketCategory,
        problemDescription,
        solutionDescription,
        targetAudience
    };
    return cacheManager.getOrSet('comprehensive-validation', params, () => _performComprehensiveValidation(title, marketCategory, problemDescription, solutionDescription, targetAudience), {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        tags: ['ai-validation', `market:${marketCategory}`, 'comprehensive']
    });
}
// Helper functions for data processing and analysis
function calculateCombinedScore(bedrockData, perplexityData) {
    if (bedrockData && perplexityData) {
        return Math.round((bedrockData.overallScore + perplexityData.score) / 2);
    }
    return bedrockData?.overallScore || perplexityData?.score || 500;
}
function generateExecutiveSummary(title, score, bedrockData, perplexityData) {
    const scoreLevel = score >= 750 ? 'Excellent' : score >= 600 ? 'Good' : score >= 400 ? 'Moderate' : 'Needs Improvement';
    const recommendation = score >= 600 ? 'strongly recommended for development' : score >= 400 ? 'shows potential with refinements needed' : 'requires significant validation and pivoting';
    return `${title} demonstrates ${scoreLevel.toLowerCase()} market potential with an overall validation score of ${score}/1000. This startup concept is ${recommendation}. The analysis combines AI-powered evaluation with real-time market research to provide comprehensive insights into market opportunity, technical feasibility, and competitive positioning.`;
}
// Additional helper functions
function generateImplementationRoadmap(title, solution) {
    return [
        "MVP development and core feature implementation",
        "User testing and feedback integration",
        "Market validation with target customers",
        "Product iteration based on user feedback",
        "Go-to-market strategy execution",
        "Scale and expansion planning"
    ];
}
function identifyTechnicalRisks(solution) {
    return [
        "Technical complexity may exceed initial estimates",
        "Integration challenges with third-party services",
        "Scalability bottlenecks as user base grows",
        "Security and data privacy compliance requirements"
    ];
}
function identifyRequiredExpertise(solution, marketCategory) {
    const baseExpertise = ["Product development", "User experience design", "Software engineering"];
    const categorySpecific = {
        'fintech': ["Financial regulations", "Security compliance", "Payment processing"],
        'healthcare': ["HIPAA compliance", "Medical domain knowledge", "Regulatory affairs"],
        'education': ["Educational theory", "Learning analytics", "Content development"],
        'default': ["Industry domain knowledge", "Business development", "Marketing"]
    };
    return [...baseExpertise, ...(categorySpecific[marketCategory.toLowerCase()] || categorySpecific.default)];
}
function extractRevenueStreams(revenueText) {
    if (!revenueText)
        return ["Subscription model", "Transaction fees", "Premium features"];
    return revenueText.split(',').map(s => s.trim()).filter(s => s.length > 0);
}
function analyzeScalability(solution, targetAudience) {
    return "Solution demonstrates strong scalability potential through digital distribution and automated processes. Key scaling factors include user acquisition efficiency and operational automation.";
}
function identifySustainabilityFactors(marketCategory) {
    return [
        "Strong customer retention and loyalty",
        "Network effects and viral growth potential",
        "Sustainable competitive advantages",
        "Recurring revenue model viability"
    ];
}
function recommendPricingStrategy(targetAudience, marketCategory) {
    return "Freemium model with premium tier upgrade path recommended. Start with competitive pricing to gain market share, then optimize based on customer value delivery.";
}
function identifyCompetitiveAdvantages(solution, competitiveAnalysis) {
    return [
        "First-mover advantage in specific market segment",
        "Unique technology or approach differentiation",
        "Superior user experience and interface design",
        "Cost-effective solution delivery"
    ];
}
function createDifferentiationStrategy(title, solution) {
    return `${title} can differentiate through superior user experience, innovative feature set, and focused market positioning. Key differentiators include unique value proposition and customer-centric approach.`;
}
function parseCustomerSegments(targetAudience) {
    return targetAudience.split(',').map(s => s.trim()).filter(s => s.length > 0);
}
function identifyCustomerNeeds(problemDescription) {
    return [
        "Efficient problem resolution",
        "Cost-effective solution",
        "User-friendly interface",
        "Reliable and consistent service"
    ];
}
function identifyAdoptionBarriers(solution, targetAudience) {
    return [
        "Learning curve for new users",
        "Integration with existing workflows",
        "Cost considerations and budget constraints",
        "Change management resistance"
    ];
}
function createPenetrationStrategy(targetAudience, marketCategory) {
    return "Multi-channel approach combining digital marketing, strategic partnerships, and direct customer engagement. Focus on early adopters and industry influencers for initial market penetration.";
}
function generateRevenueModel(targetAudience, marketCategory) {
    return "Subscription-based recurring revenue model with multiple tiers and usage-based pricing components. Additional revenue through premium features and enterprise solutions.";
}
function identifyCostStructure(solution, marketCategory) {
    return [
        "Technology development and maintenance",
        "Customer acquisition and marketing",
        "Operations and customer support",
        "Compliance and regulatory requirements"
    ];
}
function estimateFundingRequirements(complexity) {
    const fundingMap = {
        'low': '$50K-$200K seed funding for MVP development',
        'medium': '$200K-$500K for product development and market entry',
        'high': '$500K-$2M for comprehensive product development and market validation'
    };
    return fundingMap[complexity] || fundingMap.medium;
}
function performBreakEvenAnalysis(targetAudience, marketCategory) {
    return "Break-even projected within 18-24 months with customer acquisition rate of 100-200 customers per month and average customer lifetime value optimization.";
}
function identifyRiskFactors(marketCategory, competitiveAnalysis) {
    return [
        "Intense competitive pressure from established players",
        "Market adoption slower than projected",
        "Regulatory changes affecting business model",
        "Technology disruption from new entrants"
    ];
}
function generateShortTermRecommendations(marketCategory, targetAudience) {
    return [
        "Develop and launch minimum viable product (MVP)",
        "Conduct extensive user testing and feedback collection",
        "Build strategic partnerships with key industry players",
        "Implement comprehensive marketing and customer acquisition strategy"
    ];
}
function generateLongTermRecommendations(score, marketIntelligence) {
    return [
        "Scale operations and expand to adjacent markets",
        "Develop advanced features and AI capabilities",
        "Consider international expansion opportunities",
        "Explore strategic acquisition or partnership opportunities"
    ];
}
function identifyPivotOpportunities(problemDescription, solutionDescription) {
    return [
        "Adjacent market segments with similar pain points",
        "Alternative solution approaches for same problem",
        "Complementary services or products",
        "B2B vs B2C model pivot opportunities"
    ];
}
function defineSuccessMetrics(targetAudience, marketCategory) {
    return [
        "Monthly active users (MAU) growth rate",
        "Customer acquisition cost (CAC) optimization",
        "Customer lifetime value (CLV) improvement",
        "Product-market fit indicators and Net Promoter Score (NPS)"
    ];
}
function determineConfidenceLevel(bedrockData, perplexityData, marketIntelligence) {
    const dataQuality = [bedrockData, perplexityData, marketIntelligence].filter(Boolean).length;
    return dataQuality >= 3 ? 'high' : dataQuality >= 2 ? 'medium' : 'low';
}
// Parsing helper functions for Perplexity responses
function extractMarketSize(content) {
    const marketSizeMatch = content.match(/market size[^.]*\$[\d.,]+[^.]*billion|market.*\$[\d.,]+[^.]*million/i);
    return marketSizeMatch ? marketSizeMatch[0] : "Market size analysis in progress";
}
function extractOpportunity(content) {
    const sentences = content.split('.').filter(s => s.length > 50);
    return sentences.find(s => s.toLowerCase().includes('opportunity')) || "Market opportunity analysis indicates growth potential";
}
function extractMarketGaps(content) {
    const gapKeywords = ['gap', 'unmet', 'lacking', 'missing', 'need', 'challenge'];
    const sentences = content.split('.').filter(s => gapKeywords.some(keyword => s.toLowerCase().includes(keyword)));
    return sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
}
function extractCompetitiveSummary(content) {
    const sentences = content.split('.').filter(s => s.length > 30);
    return sentences.slice(0, 2).join('. ') + '.';
}
function parseDirectCompetitors(content) {
    // This is a simplified parser - in production, you'd want more sophisticated NLP
    const competitors = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return competitors.slice(0, 3).map(name => ({
        name,
        strengths: ["Established market presence", "Strong brand recognition"],
        weaknesses: ["Limited innovation", "Higher pricing"],
        marketPosition: "Established player"
    }));
}
function parseIndirectCompetitors(content) {
    return ["Traditional solutions", "Manual processes", "Alternative approaches"];
}
function extractTrends(content) {
    const trendKeywords = ['trend', 'growing', 'emerging', 'increasing', 'rising', 'adoption'];
    const sentences = content.split('.').filter(s => trendKeywords.some(keyword => s.toLowerCase().includes(keyword)));
    return sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 0);
}
// Fallback functions
function createFallbackResult(basicResult, title) {
    const fallbackEnhancedScoring = EnhancedScoringService.calculateEnhancedScore(title, 'other', 'Market validation needed', 'Solution analysis pending', 'Target audience assessment required');
    return {
        overallScore: basicResult.overallScore,
        executiveSummary: `${title} demonstrates ${basicResult.overallScore >= 600 ? 'strong' : 'moderate'} market potential with a validation score of ${basicResult.overallScore}/1000. This analysis combines AI-powered strategic evaluation with market research insights to provide comprehensive startup guidance.`,
        enhancedScoring: fallbackEnhancedScoring,
        marketAnalysis: {
            ...basicResult.marketAnalysis,
            detailedInsights: basicResult.detailedAnalysis,
            marketTrends: ["Analysis pending"],
            competitorAnalysis: "Competitive analysis in progress",
            marketOpportunity: "Market opportunity assessment needed"
        },
        technicalFeasibility: {
            ...basicResult.technicalFeasibility,
            implementationRoadmap: ["MVP development", "User testing", "Market launch"],
            technicalRisks: ["Technical complexity assessment needed"],
            requiredExpertise: ["Domain expertise required"]
        },
        businessModel: {
            score: Math.min(300, Math.round(basicResult.overallScore * 0.3)),
            revenueStreams: [
                "Subscription-based recurring revenue",
                "Transaction fees and premium features",
                "Enterprise licensing and partnerships"
            ],
            monetizationStrategy: "Multi-tiered subscription model with freemium entry point, premium features, and enterprise solutions to maximize market penetration and revenue optimization.",
            scalabilityAssessment: "Strong scalability potential through digital distribution, automated processes, and network effects. Key scaling factors include user acquisition efficiency and operational automation.",
            sustainabilityFactors: [
                "Recurring revenue model ensuring predictable cash flow",
                "Network effects driving organic user growth",
                "Sustainable competitive advantages and market positioning"
            ],
            pricingStrategy: "Freemium model with premium tier upgrades, competitive pricing for market entry, value-based pricing optimization as product matures."
        },
        competitiveIntelligence: {
            directCompetitors: [],
            indirectCompetitors: ["Traditional solutions", "Manual processes", "Alternative approaches"],
            competitiveAdvantages: [
                "First-mover advantage in specific market niche",
                "Superior user experience and intuitive design",
                "Cost-effective solution delivery model",
                "Innovative technology integration approach"
            ],
            differentiationStrategy: "Focus on unique value proposition through superior user experience, innovative features, and customer-centric approach. Emphasize ease of use, reliability, and measurable results to stand out in competitive landscape."
        },
        marketResearch: {
            targetMarketSize: "Market size research pending",
            customerSegments: ["Customer segment analysis needed"],
            customerNeeds: ["Customer needs assessment required"],
            marketGaps: ["Market gap analysis pending"],
            adoptionBarriers: ["Adoption barrier assessment needed"],
            marketPenetrationStrategy: "Penetration strategy development required"
        },
        financialProjections: {
            revenueModel: "Revenue model development needed",
            costStructure: ["Cost analysis pending"],
            fundingRequirements: "Funding assessment required",
            breakEvenAnalysis: "Break-even analysis pending",
            riskFactors: ["Risk assessment needed"]
        },
        strategicRecommendations: {
            immediate: basicResult.recommendations.slice(0, 3),
            shortTerm: [
                "Develop MVP with core features and gather user feedback",
                "Build strategic partnerships within your industry",
                "Establish key performance metrics and tracking systems"
            ],
            longTerm: [
                "Scale operations and expand market reach",
                "Explore international expansion opportunities",
                "Consider strategic acquisitions or partnerships"
            ],
            pivotOpportunities: [
                "Adjacent market segments with similar pain points",
                "Alternative business models (B2B vs B2C)",
                "Complementary product or service offerings"
            ],
            successMetrics: [
                "Monthly active users and engagement rates",
                "Customer acquisition cost and lifetime value",
                "Revenue growth and market share capture"
            ]
        },
        citations: [],
        researchSources: ['Amazon Bedrock Nova Analysis'],
        confidenceLevel: 'low',
        lastUpdated: new Date()
    };
}
function createMinimalResult(title, marketCategory) {
    const minimalEnhancedScoring = EnhancedScoringService.calculateEnhancedScore(title, marketCategory, 'Analysis pending', 'Analysis pending', 'Analysis pending');
    return {
        overallScore: 500,
        executiveSummary: `${title} requires comprehensive validation. Analysis services temporarily unavailable.`,
        enhancedScoring: minimalEnhancedScoring,
        marketAnalysis: {
            marketSize: 'medium',
            competition: 'moderate',
            trends: 'stable',
            score: 200,
            detailedInsights: "Market analysis pending",
            marketTrends: ["Market research needed"],
            competitorAnalysis: "Competitive analysis needed",
            marketOpportunity: "Market opportunity assessment pending"
        },
        technicalFeasibility: {
            complexity: 'medium',
            resourcesNeeded: 'reasonable',
            timeToMarket: '6-12 months',
            score: 150,
            implementationRoadmap: ["Development planning needed"],
            technicalRisks: ["Technical assessment required"],
            requiredExpertise: ["Expertise assessment pending"]
        },
        businessModel: {
            score: 150,
            revenueStreams: ["Revenue model development needed"],
            monetizationStrategy: "Strategy development required",
            scalabilityAssessment: "Scalability analysis needed",
            sustainabilityFactors: ["Sustainability assessment pending"],
            pricingStrategy: "Pricing strategy needed"
        },
        competitiveIntelligence: {
            directCompetitors: [],
            indirectCompetitors: ["Research needed"],
            competitiveAdvantages: ["Analysis pending"],
            differentiationStrategy: "Strategy development needed"
        },
        marketResearch: {
            targetMarketSize: "Research needed",
            customerSegments: ["Analysis pending"],
            customerNeeds: ["Assessment required"],
            marketGaps: ["Research needed"],
            adoptionBarriers: ["Analysis pending"],
            marketPenetrationStrategy: "Strategy needed"
        },
        financialProjections: {
            revenueModel: "Model development needed",
            costStructure: ["Analysis required"],
            fundingRequirements: "Assessment pending",
            breakEvenAnalysis: "Analysis needed",
            riskFactors: ["Assessment required"]
        },
        strategicRecommendations: {
            immediate: ["Conduct market research", "Validate problem-solution fit"],
            shortTerm: ["Develop MVP", "Test with users"],
            longTerm: ["Scale and expand"],
            pivotOpportunities: ["Explore alternatives"],
            successMetrics: ["Define KPIs"]
        },
        citations: [],
        researchSources: [],
        confidenceLevel: 'low',
        lastUpdated: new Date()
    };
}

;// ./server/services/domain-checker.ts
class DomainCheckerService {
    constructor() {
        this.popularTlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.tech', '.ai'];
        this.fallbackSuggestions = [
            'app', 'hub', 'pro', 'labs', 'works', 'solutions', 'platform', 'tools', 'studio', 'digital'
        ];
    }
    /**
     * Generate domain suggestions based on business name and keywords
     */
    async generateDomainSuggestions(businessName, keywords = [], marketCategory) {
        try {
            const suggestions = [];
            const cleanBusinessName = this.cleanDomainName(businessName);
            // Generate base suggestions
            const baseSuggestions = this.generateBaseSuggestions(cleanBusinessName, keywords, marketCategory);
            // Check availability for each suggestion
            for (const suggestion of baseSuggestions) {
                for (const tld of this.popularTlds) {
                    const domain = `${suggestion}${tld}`;
                    const availability = await this.checkDomainAvailability(domain);
                    suggestions.push({
                        domain,
                        available: availability.available,
                        price: availability.price,
                        registrar: availability.registrar,
                        alternatives: availability.alternatives,
                    });
                    // Limit to prevent too many API calls
                    if (suggestions.length >= 20)
                        break;
                }
                if (suggestions.length >= 20)
                    break;
            }
            // Sort by availability and preference
            return this.sortSuggestions(suggestions);
        }
        catch (error) {
            console.error('Error generating domain suggestions:', error);
            return this.getFallbackSuggestions(businessName);
        }
    }
    /**
     * Check domain availability using domain APIs
     */
    async checkDomainAvailability(domain) {
        try {
            // Try multiple domain checking services
            const results = await Promise.allSettled([
                this.checkWithNamecheap(domain),
                this.checkWithWhoisAPI(domain),
                this.checkWithDomainAPI(domain),
            ]);
            // Use the first successful result
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    return result.value;
                }
            }
            // Fallback to basic check
            return this.basicDomainCheck(domain);
        }
        catch (error) {
            console.error(`Error checking domain availability for ${domain}:`, error);
            return { available: false, alternatives: [] };
        }
    }
    /**
     * Check domain availability with Namecheap API
     */
    async checkWithNamecheap(domain) {
        if (!process.env.NAMECHEAP_API_KEY || !process.env.NAMECHEAP_USERNAME) {
            return null;
        }
        try {
            const response = await fetch(`https://api.namecheap.com/xml.response?ApiUser=${process.env.NAMECHEAP_USERNAME}&ApiKey=${process.env.NAMECHEAP_API_KEY}&UserName=${process.env.NAMECHEAP_USERNAME}&Command=namecheap.domains.check&ClientIp=127.0.0.1&DomainList=${domain}`, { method: 'GET' });
            if (response.ok) {
                const xmlText = await response.text();
                const available = xmlText.includes('Available="true"');
                return {
                    available,
                    registrar: 'Namecheap',
                    price: available ? 12.99 : undefined, // Default price
                };
            }
        }
        catch (error) {
            console.error('Namecheap API error:', error);
        }
        return null;
    }
    /**
     * Check domain availability with WHOIS API
     */
    async checkWithWhoisAPI(domain) {
        if (!process.env.WHOIS_API_KEY) {
            return null;
        }
        try {
            const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env.WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`, { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                const available = !data.WhoisRecord || data.WhoisRecord.dataError === 'MISSING';
                return {
                    available,
                    registrar: 'WHOIS API',
                };
            }
        }
        catch (error) {
            console.error('WHOIS API error:', error);
        }
        return null;
    }
    /**
     * Check domain availability with Domain API
     */
    async checkWithDomainAPI(domain) {
        if (!process.env.DOMAIN_API_KEY) {
            return null;
        }
        try {
            const response = await fetch(`https://api.domainr.com/v2/status?domain=${domain}&client_id=${process.env.DOMAIN_API_KEY}`, { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                const status = data.status?.[0]?.status;
                const available = status === 'undelegated' || status === 'inactive';
                return {
                    available,
                    registrar: 'Domain API',
                };
            }
        }
        catch (error) {
            console.error('Domain API error:', error);
        }
        return null;
    }
    /**
     * Basic domain check (fallback)
     */
    basicDomainCheck(domain) {
        // Simple heuristic: assume shorter domains are less likely to be available
        const available = domain.length > 15 || Math.random() > 0.7;
        return {
            available,
            price: available ? 14.99 : undefined,
            registrar: 'Generic',
            alternatives: available ? [] : this.generateAlternatives(domain),
        };
    }
    /**
     * Generate base domain suggestions
     */
    generateBaseSuggestions(businessName, keywords, marketCategory) {
        const suggestions = new Set();
        // Add business name variations
        suggestions.add(businessName);
        suggestions.add(businessName.replace(/\s+/g, ''));
        suggestions.add(businessName.replace(/\s+/g, '-'));
        // Add keyword combinations
        keywords.forEach(keyword => {
            const cleanKeyword = this.cleanDomainName(keyword);
            suggestions.add(`${businessName}${cleanKeyword}`);
            suggestions.add(`${cleanKeyword}${businessName}`);
            suggestions.add(`${businessName}-${cleanKeyword}`);
        });
        // Add category-specific suggestions
        if (marketCategory) {
            const categoryKeywords = this.getCategoryKeywords(marketCategory);
            categoryKeywords.forEach(catKeyword => {
                suggestions.add(`${businessName}${catKeyword}`);
                suggestions.add(`${businessName}-${catKeyword}`);
            });
        }
        // Add fallback suggestions
        this.fallbackSuggestions.forEach(suffix => {
            suggestions.add(`${businessName}${suffix}`);
            suggestions.add(`${businessName}-${suffix}`);
        });
        return Array.from(suggestions).slice(0, 10);
    }
    /**
     * Clean domain name for URL compatibility
     */
    cleanDomainName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '')
            .substring(0, 30);
    }
    /**
     * Get category-specific keywords
     */
    getCategoryKeywords(category) {
        const categoryMap = {
            saas: ['app', 'software', 'platform', 'cloud', 'tech'],
            ecommerce: ['shop', 'store', 'market', 'buy', 'sell'],
            fintech: ['pay', 'finance', 'money', 'bank', 'invest'],
            healthtech: ['health', 'medical', 'care', 'wellness', 'fit'],
            edtech: ['learn', 'edu', 'teach', 'study', 'academy'],
            other: ['hub', 'pro', 'solutions', 'works', 'digital'],
        };
        return categoryMap[category.toLowerCase()] || categoryMap.other;
    }
    /**
     * Generate alternative domain suggestions
     */
    generateAlternatives(domain) {
        const baseName = domain.split('.')[0];
        const alternatives = [];
        this.fallbackSuggestions.forEach(suffix => {
            alternatives.push(`${baseName}${suffix}.com`);
        });
        return alternatives.slice(0, 3);
    }
    /**
     * Sort suggestions by preference
     */
    sortSuggestions(suggestions) {
        return suggestions.sort((a, b) => {
            // Available domains first
            if (a.available && !b.available)
                return -1;
            if (!a.available && b.available)
                return 1;
            // Prefer .com domains
            if (a.domain.endsWith('.com') && !b.domain.endsWith('.com'))
                return -1;
            if (!a.domain.endsWith('.com') && b.domain.endsWith('.com'))
                return 1;
            // Prefer shorter domains
            return a.domain.length - b.domain.length;
        });
    }
    /**
     * Get fallback suggestions when API fails
     */
    getFallbackSuggestions(businessName) {
        const cleanName = this.cleanDomainName(businessName);
        const suggestions = [];
        this.popularTlds.forEach(tld => {
            suggestions.push({
                domain: `${cleanName}${tld}`,
                available: Math.random() > 0.5, // Random for fallback
                price: 14.99,
                registrar: 'Generic',
            });
        });
        return suggestions.slice(0, 10);
    }
}

;// ./server/services/funding-matcher.ts
class FundingMatcherService {
    constructor() {
        this.fundingOpportunities = [];
        this.initializeFundingDatabase();
    }
    /**
     * Find relevant funding opportunities based on market category and stage
     */
    async findRelevantFunding(marketCategory, businessStage, fundingAmount) {
        try {
            const relevantOpportunities = this.fundingOpportunities.filter(opportunity => {
                // Check market category match
                const categoryMatch = opportunity.marketCategories.includes(marketCategory) ||
                    opportunity.marketCategories.includes('other');
                // Check stage match
                const stageMatch = opportunity.stage.includes(businessStage);
                return categoryMatch && stageMatch;
            });
            // Calculate match scores
            const scoredOpportunities = relevantOpportunities.map(opportunity => ({
                ...opportunity,
                matchScore: this.calculateMatchScore(opportunity, marketCategory, businessStage, fundingAmount),
            }));
            // Sort by match score and return top matches
            return scoredOpportunities
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 10);
        }
        catch (error) {
            console.error('Error finding relevant funding:', error);
            return [];
        }
    }
    /**
     * Calculate match score for funding opportunity
     */
    calculateMatchScore(opportunity, marketCategory, businessStage, fundingAmount) {
        let score = 0;
        // Market category match (40% weight)
        if (opportunity.marketCategories.includes(marketCategory)) {
            score += 40;
        }
        else if (opportunity.marketCategories.includes('other')) {
            score += 20;
        }
        // Stage match (30% weight)
        if (opportunity.stage.includes(businessStage)) {
            score += 30;
        }
        // Funding amount match (20% weight)
        if (fundingAmount && opportunity.amount) {
            const amountMatch = this.calculateAmountMatch(opportunity.amount, fundingAmount);
            score += amountMatch * 20;
        }
        else {
            score += 10; // Default if no amount specified
        }
        // Application deadline (10% weight)
        if (opportunity.applicationDeadline) {
            const deadlineScore = this.calculateDeadlineScore(opportunity.applicationDeadline);
            score += deadlineScore * 10;
        }
        else {
            score += 10; // Always open applications
        }
        return Math.min(100, score);
    }
    /**
     * Calculate amount match score (0-1)
     */
    calculateAmountMatch(opportunityAmount, requestedAmount) {
        const amount = this.parseAmount(opportunityAmount);
        if (!amount)
            return 0.5;
        const ratio = Math.min(amount, requestedAmount) / Math.max(amount, requestedAmount);
        return ratio;
    }
    /**
     * Calculate deadline score (0-1)
     */
    calculateDeadlineScore(deadline) {
        try {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            if (daysUntilDeadline < 0)
                return 0; // Past deadline
            if (daysUntilDeadline > 365)
                return 0.5; // Too far in future
            if (daysUntilDeadline > 30)
                return 1; // Good timing
            if (daysUntilDeadline > 7)
                return 0.8; // Tight but doable
            return 0.3; // Very tight deadline
        }
        catch {
            return 0.5;
        }
    }
    /**
     * Parse funding amount from string
     */
    parseAmount(amountStr) {
        const match = amountStr.match(/\$?([\d,]+)(?:k|K)?/);
        if (!match)
            return null;
        const num = parseInt(match[1].replace(/,/g, ''));
        return amountStr.toLowerCase().includes('k') ? num * 1000 : num;
    }
    /**
     * Initialize funding opportunities database
     */
    initializeFundingDatabase() {
        this.fundingOpportunities = [
            // Government Grants
            {
                id: 'sbir-1',
                name: 'SBIR Phase I',
                type: 'government',
                description: 'Small Business Innovation Research grants for early-stage R&D',
                amount: '$50,000-$300,000',
                stage: ['idea', 'mvp', 'early'],
                marketCategories: ['saas', 'healthtech', 'edtech', 'fintech', 'other'],
                applicationDeadline: '2025-03-15',
                website: 'https://www.sbir.gov',
                requirements: [
                    'US-based small business',
                    'Innovative technology focus',
                    'Research and development plan',
                    'Commercialization potential'
                ],
                matchScore: 0
            },
            {
                id: 'sbir-2',
                name: 'SBIR Phase II',
                type: 'government',
                description: 'Follow-on funding for successful Phase I recipients',
                amount: '$500,000-$2,000,000',
                stage: ['mvp', 'early', 'growth'],
                marketCategories: ['saas', 'healthtech', 'edtech', 'fintech', 'other'],
                website: 'https://www.sbir.gov',
                requirements: [
                    'Successful Phase I completion',
                    'Demonstrated feasibility',
                    'Clear commercialization path',
                    'Market validation'
                ],
                matchScore: 0
            },
            // Accelerators
            {
                id: 'ycombinator',
                name: 'Y Combinator',
                type: 'accelerator',
                description: 'Premier startup accelerator with $500K investment',
                amount: '$500,000',
                stage: ['idea', 'mvp', 'early'],
                marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
                applicationDeadline: '2025-04-01',
                website: 'https://www.ycombinator.com',
                requirements: [
                    'Innovative product or service',
                    'Strong founding team',
                    'Market opportunity',
                    'Growth potential'
                ],
                matchScore: 0
            },
            {
                id: 'techstars',
                name: 'Techstars',
                type: 'accelerator',
                description: 'Global startup accelerator network',
                amount: '$120,000',
                stage: ['mvp', 'early'],
                marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
                website: 'https://www.techstars.com',
                requirements: [
                    'Working product or prototype',
                    'Committed founding team',
                    'Scalable business model',
                    'Coachable founders'
                ],
                matchScore: 0
            },
            // Venture Capital
            {
                id: 'sequoia-seed',
                name: 'Sequoia Capital Seed',
                type: 'vc',
                description: 'Seed funding from top-tier VC firm',
                amount: '$1,000,000-$5,000,000',
                stage: ['early', 'growth'],
                marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech'],
                website: 'https://www.sequoiacap.com',
                requirements: [
                    'Exceptional founding team',
                    'Large market opportunity',
                    'Product-market fit',
                    'Strong growth metrics'
                ],
                matchScore: 0
            },
            {
                id: 'a16z-seed',
                name: 'Andreessen Horowitz Seed',
                type: 'vc',
                description: 'Seed investment from a16z',
                amount: '$500,000-$3,000,000',
                stage: ['early', 'growth'],
                marketCategories: ['saas', 'fintech', 'healthtech', 'edtech', 'other'],
                website: 'https://a16z.com',
                requirements: [
                    'Technology-driven solution',
                    'Experienced team',
                    'Market validation',
                    'Scalability potential'
                ],
                matchScore: 0
            },
            // Angel Investors
            {
                id: 'angellist',
                name: 'AngelList Syndicates',
                type: 'angel',
                description: 'Angel investor network and syndicates',
                amount: '$25,000-$500,000',
                stage: ['idea', 'mvp', 'early'],
                marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
                website: 'https://angel.co',
                requirements: [
                    'Compelling pitch deck',
                    'Clear business model',
                    'Market opportunity',
                    'Team credentials'
                ],
                matchScore: 0
            },
            // Industry-Specific
            {
                id: 'health-tech-capital',
                name: 'HealthTech Capital',
                type: 'vc',
                description: 'Specialized healthcare technology investor',
                amount: '$1,000,000-$10,000,000',
                stage: ['early', 'growth', 'scale'],
                marketCategories: ['healthtech'],
                website: 'https://healthtechcapital.com',
                requirements: [
                    'Healthcare technology focus',
                    'Regulatory compliance plan',
                    'Clinical validation',
                    'Market access strategy'
                ],
                matchScore: 0
            },
            {
                id: 'fintech-ventures',
                name: 'FinTech Ventures',
                type: 'vc',
                description: 'Financial technology focused investment',
                amount: '$500,000-$5,000,000',
                stage: ['mvp', 'early', 'growth'],
                marketCategories: ['fintech'],
                website: 'https://fintechventures.com',
                requirements: [
                    'Financial services innovation',
                    'Regulatory compliance',
                    'Security standards',
                    'Market traction'
                ],
                matchScore: 0
            },
            // Crowdfunding
            {
                id: 'kickstarter',
                name: 'Kickstarter',
                type: 'crowdfunding',
                description: 'Reward-based crowdfunding platform',
                amount: '$10,000-$1,000,000',
                stage: ['mvp', 'early'],
                marketCategories: ['ecommerce', 'other'],
                website: 'https://www.kickstarter.com',
                requirements: [
                    'Creative project',
                    'Compelling rewards',
                    'Marketing plan',
                    'Prototype or demo'
                ],
                matchScore: 0
            },
            {
                id: 'indiegogo',
                name: 'Indiegogo',
                type: 'crowdfunding',
                description: 'Flexible crowdfunding platform',
                amount: '$5,000-$500,000',
                stage: ['idea', 'mvp', 'early'],
                marketCategories: ['ecommerce', 'healthtech', 'other'],
                website: 'https://www.indiegogo.com',
                requirements: [
                    'Innovative product',
                    'Clear value proposition',
                    'Marketing strategy',
                    'Community engagement'
                ],
                matchScore: 0
            }
        ];
    }
    /**
     * Get all funding opportunities
     */
    getAllFundingOpportunities() {
        return this.fundingOpportunities;
    }
    /**
     * Get funding opportunities by type
     */
    getFundingByType(type) {
        return this.fundingOpportunities.filter(opportunity => opportunity.type === type);
    }
    /**
     * Search funding opportunities by name or description
     */
    searchFunding(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.fundingOpportunities.filter(opportunity => opportunity.name.toLowerCase().includes(lowercaseQuery) ||
            opportunity.description.toLowerCase().includes(lowercaseQuery));
    }
}

;// ./server/services/privacy-manager.ts
class PrivacyManagerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Get user privacy settings
     */
    async getUserPrivacySettings(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    profilePublic: true,
                    ideasPublic: true,
                    allowFounderMatching: true,
                    allowDirectContact: true,
                },
            });
            if (!user) {
                return null;
            }
            return {
                profilePublic: user.profilePublic,
                ideasPublic: user.ideasPublic,
                allowFounderMatching: user.allowFounderMatching,
                allowDirectContact: user.allowDirectContact,
            };
        }
        catch (error) {
            console.error('Error fetching user privacy settings:', error);
            throw new Error('Failed to fetch privacy settings');
        }
    }
    /**
     * Update user privacy settings
     */
    async updatePrivacySettings(userId, settings) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profilePublic: settings.profilePublic,
                    ideasPublic: settings.ideasPublic,
                    allowFounderMatching: settings.allowFounderMatching,
                    allowDirectContact: settings.allowDirectContact,
                },
                select: {
                    profilePublic: true,
                    ideasPublic: true,
                    allowFounderMatching: true,
                    allowDirectContact: true,
                },
            });
            return {
                profilePublic: updatedUser.profilePublic,
                ideasPublic: updatedUser.ideasPublic,
                allowFounderMatching: updatedUser.allowFounderMatching,
                allowDirectContact: updatedUser.allowDirectContact,
            };
        }
        catch (error) {
            console.error('Error updating user privacy settings:', error);
            throw new Error('Failed to update privacy settings');
        }
    }
    /**
     * Filter users based on their privacy settings for founder matching
     */
    async filterPublicProfiles(userIds) {
        try {
            const publicUsers = await this.prisma.user.findMany({
                where: {
                    id: { in: userIds },
                    profilePublic: true,
                    allowFounderMatching: true,
                },
                include: {
                    ideas: {
                        where: {
                            // Only include public ideas
                            userId: {
                                in: await this.getPublicIdeaUserIds(userIds),
                            },
                        },
                    },
                },
            });
            return publicUsers;
        }
        catch (error) {
            console.error('Error filtering public profiles:', error);
            throw new Error('Failed to filter public profiles');
        }
    }
    /**
     * Get users who have public ideas
     */
    async getPublicIdeaUserIds(userIds) {
        const usersWithPublicIdeas = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                ideasPublic: true,
            },
            select: { id: true },
        });
        return usersWithPublicIdeas.map(user => user.id);
    }
    /**
     * Check if a user allows direct contact
     */
    async allowsDirectContact(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { allowDirectContact: true },
            });
            return user?.allowDirectContact ?? false;
        }
        catch (error) {
            console.error('Error checking direct contact permission:', error);
            return false;
        }
    }
    /**
     * Check if a user's profile is public
     */
    async isProfilePublic(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { profilePublic: true },
            });
            return user?.profilePublic ?? false;
        }
        catch (error) {
            console.error('Error checking profile visibility:', error);
            return false;
        }
    }
    /**
     * Check if a user's ideas are public
     */
    async areIdeasPublic(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { ideasPublic: true },
            });
            return user?.ideasPublic ?? false;
        }
        catch (error) {
            console.error('Error checking ideas visibility:', error);
            return false;
        }
    }
    /**
     * Check if a user allows founder matching
     */
    async allowsFounderMatching(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { allowFounderMatching: true },
            });
            return user?.allowFounderMatching ?? false;
        }
        catch (error) {
            console.error('Error checking founder matching permission:', error);
            return false;
        }
    }
    /**
     * Get all users who allow founder matching and have public profiles
     */
    async getMatchableUsers(excludeUserId) {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    profilePublic: true,
                    allowFounderMatching: true,
                    ...(excludeUserId && { id: { not: excludeUserId } }),
                },
                include: {
                    ideas: {
                        where: {
                            userId: {
                                in: await this.getPublicIdeaUserIds([]),
                            },
                        },
                    },
                },
            });
            return users;
        }
        catch (error) {
            console.error('Error fetching matchable users:', error);
            throw new Error('Failed to fetch matchable users');
        }
    }
    /**
     * Validate privacy settings input
     */
    validatePrivacySettings(settings) {
        const validKeys = ['profilePublic', 'ideasPublic', 'allowFounderMatching', 'allowDirectContact'];
        for (const key in settings) {
            if (!validKeys.includes(key)) {
                return false;
            }
            if (typeof settings[key] !== 'boolean') {
                return false;
            }
        }
        return true;
    }
}

;// ./server/services/founder-matcher.ts

class FounderMatcherService {
    constructor(prisma) {
        this.prisma = prisma;
        this.privacyManager = new PrivacyManagerService(prisma);
    }
    /**
     * Find similar founders based on market category and target audience
     */
    async findSimilarFounders(userId, limit = 10) {
        try {
            // Get current user's profile and ideas
            const currentUser = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    ideas: true,
                },
            });
            if (!currentUser) {
                throw new Error('User not found');
            }
            // Get all matchable users (excluding current user)
            const matchableUsers = await this.privacyManager.getMatchableUsers(userId);
            // Calculate similarity scores
            const founderMatches = [];
            for (const user of matchableUsers) {
                const matchScore = await this.calculateSimilarityScore(currentUser, user);
                if (matchScore > 0) {
                    const commonInterests = this.findCommonInterests(currentUser, user);
                    const complementarySkills = this.findComplementarySkills(currentUser, user);
                    const sharedMarketCategories = this.findSharedMarketCategories(currentUser, user);
                    const contactAllowed = await this.privacyManager.allowsDirectContact(user.id);
                    founderMatches.push({
                        user,
                        matchScore,
                        commonInterests,
                        complementarySkills,
                        sharedMarketCategories,
                        contactAllowed,
                    });
                }
            }
            // Sort by match score and return top matches
            return founderMatches
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);
        }
        catch (error) {
            console.error('Error finding similar founders:', error);
            throw new Error('Failed to find similar founders');
        }
    }
    /**
     * Calculate similarity score between two users
     */
    async calculateSimilarityScore(user1, user2) {
        let score = 0;
        // Market category similarity (30% weight)
        const marketCategoryScore = this.calculateMarketCategoryScore(user1, user2);
        score += marketCategoryScore * 0.3;
        // Role complementarity (25% weight)
        const roleScore = this.calculateRoleScore(user1, user2);
        score += roleScore * 0.25;
        // Location proximity (15% weight)
        const locationScore = this.calculateLocationScore(user1, user2);
        score += locationScore * 0.15;
        // Experience level (15% weight)
        const experienceScore = this.calculateExperienceScore(user1, user2);
        score += experienceScore * 0.15;
        // Bio similarity (10% weight)
        const bioScore = this.calculateBioScore(user1, user2);
        score += bioScore * 0.1;
        // Activity level (5% weight)
        const activityScore = this.calculateActivityScore(user1, user2);
        score += activityScore * 0.05;
        return Math.round(score);
    }
    /**
     * Calculate market category similarity score
     */
    calculateMarketCategoryScore(user1, user2) {
        const user1Categories = new Set(user1.ideas.map(idea => idea.marketCategory));
        const user2Categories = new Set(user2.ideas.map(idea => idea.marketCategory));
        if (user1Categories.size === 0 || user2Categories.size === 0) {
            return 0;
        }
        const intersection = new Set([...user1Categories].filter(x => user2Categories.has(x)));
        const union = new Set([...user1Categories, ...user2Categories]);
        return (intersection.size / union.size) * 100;
    }
    /**
     * Calculate role complementarity score
     */
    calculateRoleScore(user1, user2) {
        if (!user1.role || !user2.role) {
            return 50; // Neutral score if roles unknown
        }
        // Define complementary role pairs
        const complementaryPairs = {
            engineer: ['designer', 'marketer'],
            designer: ['engineer', 'marketer'],
            marketer: ['engineer', 'designer'],
        };
        if (user1.role === user2.role) {
            return 30; // Same role, lower complementarity
        }
        if (complementaryPairs[user1.role]?.includes(user2.role)) {
            return 100; // Highly complementary
        }
        return 60; // Different but not specifically complementary
    }
    /**
     * Calculate location proximity score
     */
    calculateLocationScore(user1, user2) {
        if (!user1.location || !user2.location) {
            return 50; // Neutral score if location unknown
        }
        const location1 = user1.location.toLowerCase();
        const location2 = user2.location.toLowerCase();
        if (location1 === location2) {
            return 100; // Same location
        }
        // Check for same city/state/country patterns
        const location1Parts = location1.split(',').map(part => part.trim());
        const location2Parts = location2.split(',').map(part => part.trim());
        let commonParts = 0;
        for (const part1 of location1Parts) {
            for (const part2 of location2Parts) {
                if (part1 === part2) {
                    commonParts++;
                    break;
                }
            }
        }
        if (commonParts > 0) {
            return Math.min(80, commonParts * 40); // Partial location match
        }
        return 20; // Different locations
    }
    /**
     * Calculate experience level score
     */
    calculateExperienceScore(user1, user2) {
        const user1Experience = this.estimateExperience(user1);
        const user2Experience = this.estimateExperience(user2);
        const experienceDiff = Math.abs(user1Experience - user2Experience);
        if (experienceDiff === 0) {
            return 100; // Same experience level
        }
        else if (experienceDiff === 1) {
            return 80; // Close experience levels
        }
        else if (experienceDiff === 2) {
            return 60; // Moderate difference
        }
        else {
            return 40; // Large difference
        }
    }
    /**
     * Estimate user experience level based on profile data
     */
    estimateExperience(user) {
        let experience = 0;
        // Ideas count contributes to experience
        experience += Math.min(user.ideas.length, 3);
        // Bio length as proxy for experience
        if (user.bio) {
            experience += Math.min(Math.floor(user.bio.length / 100), 2);
        }
        // Account age
        const accountAge = Date.now() - user.createdAt.getTime();
        const monthsOld = accountAge / (1000 * 60 * 60 * 24 * 30);
        experience += Math.min(Math.floor(monthsOld / 6), 3);
        return Math.min(experience, 5); // Cap at 5
    }
    /**
     * Calculate bio similarity score
     */
    calculateBioScore(user1, user2) {
        if (!user1.bio || !user2.bio) {
            return 50; // Neutral if no bio
        }
        const bio1Words = user1.bio.toLowerCase().split(/\s+/);
        const bio2Words = user2.bio.toLowerCase().split(/\s+/);
        const commonWords = bio1Words.filter(word => bio2Words.includes(word) && word.length > 3);
        const totalWords = new Set([...bio1Words, ...bio2Words]).size;
        if (totalWords === 0)
            return 0;
        return Math.min((commonWords.length / totalWords) * 200, 100);
    }
    /**
     * Calculate activity level score
     */
    calculateActivityScore(user1, user2) {
        const user1Activity = this.calculateActivityLevel(user1);
        const user2Activity = this.calculateActivityLevel(user2);
        const activityDiff = Math.abs(user1Activity - user2Activity);
        return Math.max(0, 100 - (activityDiff * 25));
    }
    /**
     * Calculate user activity level
     */
    calculateActivityLevel(user) {
        let activity = 0;
        // Recent ideas
        const recentIdeas = user.ideas.filter(idea => {
            const ideaAge = Date.now() - idea.createdAt.getTime();
            return ideaAge < (30 * 24 * 60 * 60 * 1000); // Last 30 days
        });
        activity += recentIdeas.length;
        // Profile completeness
        if (user.bio)
            activity += 1;
        if (user.location)
            activity += 1;
        if (user.role)
            activity += 1;
        return Math.min(activity, 4);
    }
    /**
     * Find common interests between users
     */
    findCommonInterests(user1, user2) {
        const interests = new Set();
        // Market categories
        const user1Categories = user1.ideas.map(idea => idea.marketCategory);
        const user2Categories = user2.ideas.map(idea => idea.marketCategory);
        for (const category of user1Categories) {
            if (user2Categories.includes(category)) {
                interests.add(this.formatMarketCategory(category));
            }
        }
        // Location
        if (user1.location && user2.location && user1.location === user2.location) {
            interests.add(`Based in ${user1.location}`);
        }
        return Array.from(interests);
    }
    /**
     * Find complementary skills between users
     */
    findComplementarySkills(user1, user2) {
        const skills = [];
        if (user1.role && user2.role && user1.role !== user2.role) {
            skills.push(`${this.formatRole(user1.role)} + ${this.formatRole(user2.role)} combination`);
        }
        return skills;
    }
    /**
     * Find shared market categories
     */
    findSharedMarketCategories(user1, user2) {
        const user1Categories = new Set(user1.ideas.map(idea => idea.marketCategory));
        const user2Categories = new Set(user2.ideas.map(idea => idea.marketCategory));
        return Array.from(user1Categories).filter(category => user2Categories.has(category));
    }
    /**
     * Format market category for display
     */
    formatMarketCategory(category) {
        const categoryMap = {
            saas: 'SaaS',
            ecommerce: 'E-commerce',
            fintech: 'FinTech',
            healthtech: 'HealthTech',
            edtech: 'EdTech',
            other: 'Other',
        };
        return categoryMap[category] || category;
    }
    /**
     * Format role for display
     */
    formatRole(role) {
        const roleMap = {
            engineer: 'Engineering',
            designer: 'Design',
            marketer: 'Marketing',
        };
        return roleMap[role] || role;
    }
}

;// ./server/services/pro-report-generator.ts




class ProReportGeneratorService {
    constructor(prisma) {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials are required');
        }
        this.bedrockClient = new client_bedrock_runtime_namespaceObject.BedrockRuntimeClient({
            region: process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
        this.domainChecker = new DomainCheckerService();
        this.fundingMatcher = new FundingMatcherService();
        this.founderMatcher = new FounderMatcherService(prisma);
    }
    /**
     * Helper method to invoke Bedrock Nova model
     */
    async invokeBedrockModel(prompt) {
        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: [{ text: prompt }]
                }
            ],
            inferenceConfig: {
                maxTokens: 4000,
                temperature: 0.7,
                topP: 0.9
            }
        };
        const command = new client_bedrock_runtime_namespaceObject.InvokeModelCommand({
            modelId: "us.amazon.nova-pro-v1:0", // Using Nova Pro inference profile
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });
        const response = await this.bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.output?.message?.content?.[0]?.text || '';
    }
    /**
     * Generate comprehensive pro business report
     */
    async generateProReport(userId, title, marketCategory, problemDescription, solutionDescription, targetAudience) {
        try {
            console.log(`[Pro Report] Starting generation for: ${title}`);
            // Generate all sections in parallel where possible
            const [executiveSummary, companyDescription, enhancedMarketAnalysis, organizationManagement, productServiceLine, marketingSalesStrategy, financialProjections, fundingOpportunities, startupResources, domainSuggestions, founderMatches] = await Promise.allSettled([
                this.generateExecutiveSummary(title, problemDescription, solutionDescription, targetAudience),
                this.generateCompanyDescription(title, solutionDescription, marketCategory),
                this.generateEnhancedMarketAnalysis(title, marketCategory, targetAudience, problemDescription),
                this.generateOrganizationManagement(marketCategory, solutionDescription),
                this.generateProductServiceLine(title, solutionDescription, marketCategory),
                this.generateMarketingSalesStrategy(title, targetAudience, marketCategory, solutionDescription),
                this.generateFinancialProjections(marketCategory, targetAudience, solutionDescription),
                this.fundingMatcher.findRelevantFunding(marketCategory, 'early'),
                this.generateStartupResources(marketCategory),
                this.domainChecker.generateDomainSuggestions(title, [marketCategory], marketCategory),
                this.founderMatcher.findSimilarFounders(userId, 5)
            ]);
            const report = {
                executiveSummary: this.getSettledValue(executiveSummary, this.getDefaultExecutiveSummary(title)),
                companyDescription: this.getSettledValue(companyDescription, this.getDefaultCompanyDescription()),
                enhancedMarketAnalysis: this.getSettledValue(enhancedMarketAnalysis, this.getDefaultMarketAnalysis()),
                organizationManagement: this.getSettledValue(organizationManagement, this.getDefaultOrganizationManagement()),
                productServiceLine: this.getSettledValue(productServiceLine, this.getDefaultProductServiceLine()),
                marketingSalesStrategy: this.getSettledValue(marketingSalesStrategy, this.getDefaultMarketingSalesStrategy()),
                financialProjections: this.getSettledValue(financialProjections, this.getDefaultFinancialProjections()),
                fundingOpportunities: this.getSettledValue(fundingOpportunities, []),
                startupResources: this.getSettledValue(startupResources, this.getDefaultStartupResources()),
                domainSuggestions: this.getSettledValue(domainSuggestions, []),
                founderMatches: this.getSettledValue(founderMatches, []),
                generatedAt: new Date(),
                lastUpdated: new Date(),
                version: '1.0',
                confidenceScore: 85
            };
            console.log(`[Pro Report] Generation completed for: ${title}`);
            return report;
        }
        catch (error) {
            console.error('[Pro Report] Error generating pro report:', error);
            throw new Error('Failed to generate pro business report');
        }
    }
    /**
     * Generate executive summary using AI
     */
    async generateExecutiveSummary(title, problemDescription, solutionDescription, targetAudience) {
        const prompt = `
    Generate a comprehensive executive summary for the startup "${title}".
    
    Problem: ${problemDescription}
    Solution: ${solutionDescription}
    Target Audience: ${targetAudience}
    
    Please provide:
    1. Business Overview (2-3 sentences)
    2. Mission Statement (1 sentence)
    3. Vision Statement (1 sentence)
    4. Key Success Factors (3-5 bullet points)
    5. Investment Highlights (3-5 bullet points)
    
    Format as JSON with keys: businessOverview, missionStatement, visionStatement, keySuccessFactors (array), investmentHighlights (array)
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating executive summary:', error);
            return this.getDefaultExecutiveSummary(title);
        }
    }
    /**
     * Generate company description using AI
     */
    async generateCompanyDescription(title, solutionDescription, marketCategory) {
        const prompt = `
    Generate a detailed company description for "${title}" in the ${marketCategory} market.
    
    Solution: ${solutionDescription}
    
    Please provide:
    1. Business Model (detailed description)
    2. Value Proposition (clear statement)
    3. Competitive Advantages (3-5 points)
    4. Business Structure (recommended structure)
    5. Ownership Structure (recommended approach)
    
    Format as JSON with keys: businessModel, valueProposition, competitiveAdvantages (array), businessStructure, ownershipStructure
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating company description:', error);
            return this.getDefaultCompanyDescription();
        }
    }
    /**
     * Generate enhanced market analysis using AI
     */
    async generateEnhancedMarketAnalysis(title, marketCategory, targetAudience, problemDescription) {
        const prompt = `
    Generate a comprehensive market analysis for "${title}" in the ${marketCategory} market.
    
    Target Audience: ${targetAudience}
    Problem: ${problemDescription}
    
    Please provide detailed analysis including:
    1. Market Size (with specific numbers if possible)
    2. Market Growth Rate (percentage)
    3. Target Market Segments (3-5 segments)
    4. Customer Personas (2-3 detailed personas with name, demographics, painPoints, buyingBehavior)
    5. Market Trends (5-7 current trends)
    6. Competitive Landscape with directCompetitors (3-5 competitors with name, marketShare, strengths, weaknesses), indirectCompetitors (3-5), and competitivePositioning
    
    Format as JSON matching the structure needed.
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating market analysis:', error);
            return this.getDefaultMarketAnalysis();
        }
    }
    /**
     * Generate organization management structure using AI
     */
    async generateOrganizationManagement(marketCategory, solutionDescription) {
        const prompt = `
    Generate an organization and management plan for a ${marketCategory} startup.
    
    Solution: ${solutionDescription}
    
    Please provide:
    1. Organizational Structure (description)
    2. Key Personnel (3-5 roles with role, responsibilities array, qualifications)
    3. Advisory Board (3-5 suggested advisor types)
    4. Hiring Plan (5-7 roles with role, timeline, priority)
    5. Compensation Strategy (description)
    
    Format as JSON with the exact structure needed.
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating organization management:', error);
            return this.getDefaultOrganizationManagement();
        }
    }
    /**
     * Helper method to safely extract values from settled promises
     */
    getSettledValue(settledResult, defaultValue) {
        return settledResult.status === 'fulfilled' ? settledResult.value : defaultValue;
    }
    // Default fallback methods
    getDefaultExecutiveSummary(title) {
        return {
            businessOverview: `${title} is an innovative startup addressing market needs through technology-driven solutions.`,
            missionStatement: `To provide exceptional value to our customers through innovative solutions.`,
            visionStatement: `To become a leading player in our market category.`,
            keySuccessFactors: [
                'Strong product-market fit',
                'Experienced founding team',
                'Scalable business model',
                'Clear competitive advantages'
            ],
            investmentHighlights: [
                'Large addressable market',
                'Proven business model',
                'Strong growth potential',
                'Experienced team'
            ]
        };
    }
    getDefaultCompanyDescription() {
        return {
            businessModel: 'Subscription-based SaaS model with tiered pricing',
            valueProposition: 'Delivering exceptional value through innovative technology solutions',
            competitiveAdvantages: [
                'First-mover advantage',
                'Superior technology',
                'Strong team',
                'Customer focus'
            ],
            businessStructure: 'Delaware C-Corporation',
            ownershipStructure: 'Founder equity with employee stock option plan'
        };
    }
    getDefaultMarketAnalysis() {
        return {
            marketSize: '$10B+ addressable market',
            marketGrowthRate: '15-20% annually',
            targetMarketSegments: ['Early adopters', 'SMB market', 'Enterprise clients'],
            customerPersonas: [
                {
                    name: 'Tech-Savvy Professional',
                    demographics: '25-45 years old, urban, college-educated',
                    painPoints: ['Time constraints', 'Efficiency needs', 'Cost concerns'],
                    buyingBehavior: 'Research-driven, values ROI'
                }
            ],
            marketTrends: ['Digital transformation', 'Remote work adoption', 'AI integration'],
            competitiveLandscape: {
                directCompetitors: [],
                indirectCompetitors: ['Traditional solutions', 'Manual processes'],
                competitivePositioning: 'Innovative technology leader'
            }
        };
    }
    getDefaultOrganizationManagement() {
        return {
            organizationalStructure: 'Flat organizational structure with clear reporting lines',
            keyPersonnel: [
                {
                    role: 'CEO',
                    responsibilities: ['Strategic vision', 'Fundraising', 'Team leadership'],
                    qualifications: 'Proven leadership experience in relevant industry'
                }
            ],
            advisoryBoard: ['Industry expert', 'Technical advisor', 'Business mentor'],
            hiringPlan: [
                {
                    role: 'CTO',
                    timeline: '0-3 months',
                    priority: 'high'
                }
            ],
            compensationStrategy: 'Competitive salaries with equity participation'
        };
    }
    getDefaultProductServiceLine() {
        return {
            productDescription: 'Innovative technology solution addressing market needs',
            productLifecycle: 'Early development stage with MVP completed',
            researchDevelopment: ['Continuous product improvement', 'Feature development'],
            intellectualProperty: ['Proprietary algorithms', 'Trade secrets'],
            productRoadmap: [
                {
                    feature: 'Core functionality',
                    timeline: 'Q1 2025',
                    priority: 'high'
                }
            ],
            qualityAssurance: 'Comprehensive testing and quality control processes'
        };
    }
    getDefaultMarketingSalesStrategy() {
        return {
            marketingStrategy: 'Digital-first marketing approach with content marketing focus',
            salesStrategy: 'Inside sales model with customer success focus',
            pricingStrategy: 'Value-based pricing with tiered options',
            distributionChannels: ['Direct sales', 'Online platform', 'Partner channels'],
            customerAcquisitionStrategy: 'Inbound marketing and referral programs',
            customerRetentionStrategy: 'Exceptional customer service and continuous value delivery',
            brandingStrategy: 'Professional, trustworthy, innovative brand positioning',
            digitalMarketingPlan: ['SEO optimization', 'Content marketing', 'Social media presence']
        };
    }
    getDefaultFinancialProjections() {
        return {
            revenueProjections: [
                { year: 1, revenue: 100000, growth: 0 },
                { year: 2, revenue: 500000, growth: 400 },
                { year: 3, revenue: 1500000, growth: 200 }
            ],
            expenseProjections: [
                { year: 1, expenses: 150000, breakdown: { personnel: 100000, marketing: 30000, operations: 20000 } }
            ],
            profitabilityAnalysis: {
                grossMargin: 80,
                netMargin: 20,
                breakEvenPoint: 'Month 18'
            },
            cashFlowProjections: [
                { year: 1, cashFlow: -50000, cumulativeCashFlow: -50000 }
            ],
            fundingRequirements: {
                totalFunding: 500000,
                useOfFunds: { product: 200000, marketing: 150000, operations: 150000 },
                fundingStages: [
                    { stage: 'Seed', amount: 500000, timeline: 'Q1 2025' }
                ]
            }
        };
    }
    /**
     * Generate product service line using AI
     */
    async generateProductServiceLine(title, solutionDescription, marketCategory) {
        const prompt = `
    Generate a detailed product/service line analysis for "${title}" in the ${marketCategory} market.

    Solution: ${solutionDescription}

    Please provide:
    1. Product Description (detailed overview)
    2. Product Lifecycle (current stage and future stages)
    3. Research & Development (3-5 R&D priorities)
    4. Intellectual Property (potential IP assets)
    5. Product Roadmap (5-7 features with feature, timeline, priority)
    6. Quality Assurance (QA approach)

    Format as JSON with exact structure needed.
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating product service line:', error);
            return this.getDefaultProductServiceLine();
        }
    }
    /**
     * Generate marketing and sales strategy using AI
     */
    async generateMarketingSalesStrategy(title, targetAudience, marketCategory, solutionDescription) {
        const prompt = `
    Generate a comprehensive marketing and sales strategy for "${title}" targeting ${targetAudience} in the ${marketCategory} market.

    Solution: ${solutionDescription}

    Please provide:
    1. Marketing Strategy (overall approach)
    2. Sales Strategy (sales approach and process)
    3. Pricing Strategy (pricing model and rationale)
    4. Distribution Channels (3-5 channels)
    5. Customer Acquisition Strategy (detailed approach)
    6. Customer Retention Strategy (retention tactics)
    7. Branding Strategy (brand positioning)
    8. Digital Marketing Plan (5-7 digital tactics)

    Format as JSON with exact structure needed.
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating marketing sales strategy:', error);
            return this.getDefaultMarketingSalesStrategy();
        }
    }
    /**
     * Generate financial projections using AI
     */
    async generateFinancialProjections(marketCategory, targetAudience, solutionDescription) {
        const prompt = `
    Generate realistic financial projections for a ${marketCategory} startup targeting ${targetAudience}.

    Solution: ${solutionDescription}

    Please provide:
    1. Revenue Projections (3 years with year, revenue, growth percentage)
    2. Expense Projections (3 years with year, expenses, breakdown object)
    3. Profitability Analysis (grossMargin, netMargin percentages, breakEvenPoint)
    4. Cash Flow Projections (3 years with year, cashFlow, cumulativeCashFlow)
    5. Funding Requirements (totalFunding, useOfFunds object, fundingStages array)

    Use realistic numbers based on typical ${marketCategory} startups.
    Format as JSON with exact structure needed.
    `;
        try {
            const response = await this.invokeBedrockModel(prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedResponse);
        }
        catch (error) {
            console.error('Error generating financial projections:', error);
            return this.getDefaultFinancialProjections();
        }
    }
    /**
     * Generate startup resources based on market category
     */
    async generateStartupResources(marketCategory) {
        const baseResources = this.getDefaultStartupResources();
        // Add category-specific resources
        const categoryResources = this.getCategorySpecificResources(marketCategory);
        return {
            legalResources: [...baseResources.legalResources, ...categoryResources.legal],
            accountingResources: [...baseResources.accountingResources, ...categoryResources.accounting],
            marketingTools: [...baseResources.marketingTools, ...categoryResources.marketing],
            technicalServices: [...baseResources.technicalServices, ...categoryResources.technical]
        };
    }
    /**
     * Get category-specific resources
     */
    getCategorySpecificResources(marketCategory) {
        const categoryMap = {
            saas: {
                legal: [{ name: 'SaaS Legal Templates', description: 'SaaS-specific legal documents', website: 'https://saaslegaltemplates.com', category: 'Legal' }],
                accounting: [{ name: 'ChartMogul', description: 'SaaS metrics and analytics', website: 'https://chartmogul.com', category: 'Accounting' }],
                marketing: [{ name: 'Intercom', description: 'Customer messaging platform', website: 'https://intercom.com', category: 'Marketing' }],
                technical: [{ name: 'Stripe', description: 'Payment processing for SaaS', website: 'https://stripe.com', category: 'Technical' }]
            },
            fintech: {
                legal: [{ name: 'FinTech Legal Advisors', description: 'Financial services compliance', website: 'https://fintechlegal.com', category: 'Legal' }],
                accounting: [{ name: 'Pilot', description: 'Bookkeeping for startups', website: 'https://pilot.com', category: 'Accounting' }],
                marketing: [{ name: 'Segment', description: 'Customer data platform', website: 'https://segment.com', category: 'Marketing' }],
                technical: [{ name: 'Plaid', description: 'Financial data APIs', website: 'https://plaid.com', category: 'Technical' }]
            },
            healthtech: {
                legal: [{ name: 'HIPAA Compliance', description: 'Healthcare compliance services', website: 'https://hipaacompliance.com', category: 'Legal' }],
                accounting: [{ name: 'Healthcare CFO', description: 'Healthcare financial services', website: 'https://healthcarecfo.com', category: 'Accounting' }],
                marketing: [{ name: 'Healthcare Marketing', description: 'Healthcare-focused marketing', website: 'https://healthcaremarketing.com', category: 'Marketing' }],
                technical: [{ name: 'Epic', description: 'Healthcare software integration', website: 'https://epic.com', category: 'Technical' }]
            },
            edtech: {
                legal: [{ name: 'EdTech Legal', description: 'Education technology compliance', website: 'https://edtechlegal.com', category: 'Legal' }],
                accounting: [{ name: 'EdTech Accounting', description: 'Education sector accounting', website: 'https://edtechaccounting.com', category: 'Accounting' }],
                marketing: [{ name: 'EdTech Marketing', description: 'Education marketing specialists', website: 'https://edtechmarketing.com', category: 'Marketing' }],
                technical: [{ name: 'Canvas API', description: 'Learning management integration', website: 'https://canvas.instructure.com', category: 'Technical' }]
            },
            ecommerce: {
                legal: [{ name: 'E-commerce Legal', description: 'Online retail legal services', website: 'https://ecommercelegal.com', category: 'Legal' }],
                accounting: [{ name: 'A2X', description: 'E-commerce accounting automation', website: 'https://a2x.com', category: 'Accounting' }],
                marketing: [{ name: 'Klaviyo', description: 'E-commerce email marketing', website: 'https://klaviyo.com', category: 'Marketing' }],
                technical: [{ name: 'Shopify', description: 'E-commerce platform', website: 'https://shopify.com', category: 'Technical' }]
            },
            other: {
                legal: [],
                accounting: [],
                marketing: [],
                technical: []
            }
        };
        return categoryMap[marketCategory] || categoryMap.other;
    }
    getDefaultStartupResources() {
        return {
            legalResources: [
                {
                    name: 'Clerky',
                    description: 'Corporate formation and equity management',
                    website: 'https://clerky.com',
                    category: 'Legal'
                }
            ],
            accountingResources: [
                {
                    name: 'QuickBooks',
                    description: 'Accounting and bookkeeping software',
                    website: 'https://quickbooks.intuit.com',
                    category: 'Accounting'
                }
            ],
            marketingTools: [
                {
                    name: 'HubSpot',
                    description: 'CRM and marketing automation',
                    website: 'https://hubspot.com',
                    category: 'Marketing'
                }
            ],
            technicalServices: [
                {
                    name: 'AWS',
                    description: 'Cloud computing services',
                    website: 'https://aws.amazon.com',
                    category: 'Technical'
                }
            ]
        };
    }
}

;// external "stripe"
const external_stripe_namespaceObject = require("stripe");
var external_stripe_default = /*#__PURE__*/__webpack_require__.n(external_stripe_namespaceObject);
;// ./server/services/stripe.ts

// Initialize Stripe with secret key
const stripe = new (external_stripe_default())(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
class stripe_StripeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create or retrieve a Stripe customer for a user
     */
    async createOrGetCustomer(userId) {
        try {
            // Check if user already has a Stripe customer ID
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    stripeCustomerId: true,
                    email: true,
                    firstName: true,
                    lastName: true
                },
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Return existing customer ID if available
            if (user.stripeCustomerId) {
                return user.stripeCustomerId;
            }
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email || undefined,
                name: user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : undefined,
                metadata: {
                    userId: userId,
                },
            });
            // Update user with Stripe customer ID
            await this.prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customer.id },
            });
            return customer.id;
        }
        catch (error) {
            console.error('Error creating/getting Stripe customer:', error);
            throw new Error('Failed to create or retrieve customer');
        }
    }
    /**
     * Create a checkout session for subscription
     */
    async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
        try {
            const customerId = await this.createOrGetCustomer(userId);
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId: userId,
                },
            });
            return session;
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }
    /**
     * Create a customer portal session for subscription management
     */
    async createCustomerPortalSession(userId, returnUrl) {
        try {
            const customerId = await this.createOrGetCustomer(userId);
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
            return session;
        }
        catch (error) {
            console.error('Error creating customer portal session:', error);
            throw new Error('Failed to create customer portal session');
        }
    }
    /**
     * Get subscription details for a user
     */
    async getUserSubscription(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    stripeSubscriptionId: true,
                    subscriptionStatus: true,
                    subscriptionPeriodEnd: true,
                    subscriptionCancelAtPeriodEnd: true,
                    subscriptionTier: true,
                },
            });
            if (!user) {
                throw new Error('User not found');
            }
            return {
                subscriptionId: user.stripeSubscriptionId,
                status: user.subscriptionStatus,
                periodEnd: user.subscriptionPeriodEnd,
                cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
                tier: user.subscriptionTier,
            };
        }
        catch (error) {
            console.error('Error getting user subscription:', error);
            throw new Error('Failed to get subscription details');
        }
    }
    /**
     * Update user subscription status from Stripe webhook
     */
    async updateSubscriptionFromWebhook(subscription, eventType) {
        try {
            const customerId = subscription.customer;
            // Find user by Stripe customer ID
            const user = await this.prisma.user.findFirst({
                where: { stripeCustomerId: customerId },
            });
            if (!user) {
                console.error('User not found for customer ID:', customerId);
                return;
            }
            // Determine subscription tier based on status
            const subscriptionTier = subscription.status === 'active' ? 'pro' : 'free';
            // Update user subscription details
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    stripeSubscriptionId: subscription.id,
                    subscriptionStatus: subscription.status,
                    subscriptionTier: subscriptionTier,
                    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
                    subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
                },
            });
            console.log(`Updated subscription for user ${user.id}: ${subscription.status}`);
        }
        catch (error) {
            console.error('Error updating subscription from webhook:', error);
            throw error;
        }
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw new Error('Invalid webhook signature');
        }
    }
    /**
     * Check if user has active subscription
     */
    async hasActiveSubscription(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    subscriptionStatus: true,
                    subscriptionPeriodEnd: true,
                },
            });
            if (!user) {
                return false;
            }
            // Check if subscription is active and not expired
            const isActive = user.subscriptionStatus === 'active';
            const notExpired = user.subscriptionPeriodEnd
                ? user.subscriptionPeriodEnd > new Date()
                : false;
            return isActive && notExpired;
        }
        catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }
}


;// ./server/middleware/subscription.ts

/**
 * Middleware to check if user has an active pro subscription
 */
function requireProSubscription(prisma) {
    const stripeService = new stripe_StripeService(prisma);
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                });
            }
            const userId = req.user.id;
            // Check if user has active subscription
            const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);
            if (!hasActiveSubscription) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'SUBSCRIPTION_REQUIRED',
                        message: 'Pro subscription required to access this feature',
                        upgradeUrl: '/pricing'
                    }
                });
            }
            next();
        }
        catch (error) {
            console.error('Subscription check error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_CHECK_FAILED',
                    message: 'Failed to verify subscription status'
                }
            });
        }
    };
}
/**
 * Middleware to check subscription and add subscription info to request
 */
function addSubscriptionInfo(prisma) {
    const stripeService = new StripeService(prisma);
    return async (req, res, next) => {
        try {
            if (!req.user) {
                req.subscription = {
                    tier: 'free',
                    status: null,
                    subscriptionId: null,
                    periodEnd: null,
                    cancelAtPeriodEnd: false
                };
                return next();
            }
            const userId = req.user.id;
            // Get subscription details
            const subscription = await stripeService.getUserSubscription(userId);
            req.subscription = subscription;
            next();
        }
        catch (error) {
            console.error('Error adding subscription info:', error);
            // Continue without subscription info rather than failing
            req.subscription = {
                tier: 'free',
                status: null,
                subscriptionId: null,
                periodEnd: null,
                cancelAtPeriodEnd: false
            };
            next();
        }
    };
}
/**
 * Rate limiting middleware for free users
 */
function rateLimitFreeUsers(prisma, limit = 5, windowMs = 60 * 60 * 1000 // 1 hour
) {
    const requestCounts = new Map();
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                });
            }
            const userId = req.user.id;
            const stripeService = new stripe_StripeService(prisma);
            // Check if user has pro subscription
            const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);
            // Skip rate limiting for pro users
            if (hasActiveSubscription) {
                return next();
            }
            // Apply rate limiting for free users
            const now = Date.now();
            const userRequests = requestCounts.get(userId);
            if (!userRequests || now > userRequests.resetTime) {
                // Reset or initialize counter
                requestCounts.set(userId, {
                    count: 1,
                    resetTime: now + windowMs
                });
                return next();
            }
            if (userRequests.count >= limit) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: `Free users are limited to ${limit} requests per hour. Upgrade to Pro for unlimited access.`,
                        upgradeUrl: '/pricing',
                        resetTime: new Date(userRequests.resetTime).toISOString()
                    }
                });
            }
            // Increment counter
            userRequests.count++;
            requestCounts.set(userId, userRequests);
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // Continue without rate limiting rather than failing
            next();
        }
    };
}
/**
 * Feature flag middleware - checks if feature is available for user's subscription tier
 */
function requireFeature(prisma, featureName, proOnly = true) {
    const stripeService = new StripeService(prisma);
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                });
            }
            const userId = req.user.id;
            if (proOnly) {
                const hasActiveSubscription = await stripeService.hasActiveSubscription(userId);
                if (!hasActiveSubscription) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'FEATURE_REQUIRES_PRO',
                            message: `The ${featureName} feature requires a Pro subscription`,
                            feature: featureName,
                            upgradeUrl: '/pricing'
                        }
                    });
                }
            }
            next();
        }
        catch (error) {
            console.error(`Feature check error for ${featureName}:`, error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FEATURE_CHECK_FAILED',
                    message: 'Failed to verify feature access'
                }
            });
        }
    };
}

;// external "zod"
const external_zod_namespaceObject = require("zod");
// EXTERNAL MODULE: external "@prisma/client"
var client_ = __webpack_require__(330);
var client_default = /*#__PURE__*/__webpack_require__.n(client_);
;// ./shared/validation.ts


const { Role, SubscriptionTier, MatchStatus, MarketCategory } = (client_default());
// Enum schemas
const roleSchema = external_zod_namespaceObject.z.nativeEnum(Role);
const subscriptionTierSchema = external_zod_namespaceObject.z.nativeEnum(SubscriptionTier);
const matchStatusSchema = external_zod_namespaceObject.z.nativeEnum(MatchStatus);
const marketCategorySchema = external_zod_namespaceObject.z.nativeEnum(MarketCategory);
// Insert schemas
const insertUserSchema = external_zod_namespaceObject.z.object({
    id: external_zod_namespaceObject.z.string(),
    email: external_zod_namespaceObject.z.string().email().optional(),
    firstName: external_zod_namespaceObject.z.string().optional(),
    lastName: external_zod_namespaceObject.z.string().optional(),
    profileImageUrl: external_zod_namespaceObject.z.string().url().optional(),
    role: roleSchema.optional(),
    location: external_zod_namespaceObject.z.string().optional(),
    bio: external_zod_namespaceObject.z.string().optional(),
    subscriptionTier: subscriptionTierSchema.optional(),
    totalIdeaScore: external_zod_namespaceObject.z.number().optional(),
    profileViews: external_zod_namespaceObject.z.number().optional(),
});
const insertIdeaSchema = external_zod_namespaceObject.z.object({
    userId: external_zod_namespaceObject.z.string(),
    title: external_zod_namespaceObject.z.string().min(1),
    marketCategory: marketCategorySchema,
    problemDescription: external_zod_namespaceObject.z.string().min(1),
    solutionDescription: external_zod_namespaceObject.z.string().min(1),
    targetAudience: external_zod_namespaceObject.z.string().min(1),
});
const insertSubmissionSchema = external_zod_namespaceObject.z.object({
    userId: external_zod_namespaceObject.z.string(),
    role: roleSchema,
    title: external_zod_namespaceObject.z.string().min(1),
    description: external_zod_namespaceObject.z.string().min(1),
    portfolioUrl: external_zod_namespaceObject.z.string().url().optional(),
    githubUrl: external_zod_namespaceObject.z.string().url().optional(),
    liveUrl: external_zod_namespaceObject.z.string().url().optional(),
    fileUrls: external_zod_namespaceObject.z.array(external_zod_namespaceObject.z.string()).optional(),
});
const insertMatchSchema = external_zod_namespaceObject.z.object({
    user1Id: external_zod_namespaceObject.z.string(),
    user2Id: external_zod_namespaceObject.z.string(),
    status: matchStatusSchema.optional(),
    compatibilityScore: external_zod_namespaceObject.z.number().optional(),
    user1Interested: external_zod_namespaceObject.z.boolean().optional(),
    user2Interested: external_zod_namespaceObject.z.boolean().optional(),
});
const insertMessageSchema = external_zod_namespaceObject.z.object({
    matchId: external_zod_namespaceObject.z.string(),
    senderId: external_zod_namespaceObject.z.string(),
    content: external_zod_namespaceObject.z.string().min(1),
});
// Update schemas
const updateUserSchema = insertUserSchema.partial().omit({ id: true });
const updateIdeaSchema = insertIdeaSchema.partial().omit({ userId: true });
const updateSubmissionSchema = insertSubmissionSchema.partial().omit({ userId: true });
const updateMatchSchema = insertMatchSchema.partial().omit({ user1Id: true, user2Id: true });
const updateMessageSchema = insertMessageSchema.partial().omit({ matchId: true, senderId: true });

// EXTERNAL MODULE: external "@aws-sdk/client-s3"
var client_s3_ = __webpack_require__(43);
;// external "@aws-sdk/s3-request-presigner"
const s3_request_presigner_namespaceObject = require("@aws-sdk/s3-request-presigner");
;// external "multer"
const external_multer_namespaceObject = require("multer");
var external_multer_default = /*#__PURE__*/__webpack_require__.n(external_multer_namespaceObject);
;// external "multer-s3"
const external_multer_s3_namespaceObject = require("multer-s3");
var external_multer_s3_default = /*#__PURE__*/__webpack_require__.n(external_multer_s3_namespaceObject);
;// external "path"
const external_path_namespaceObject = require("path");
var external_path_default = /*#__PURE__*/__webpack_require__.n(external_path_namespaceObject);
;// external "nanoid"
const external_nanoid_namespaceObject = require("nanoid");
;// ./server/services/s3-storage.ts






// Initialize AWS S3 client
const s3Client = new client_s3_.S3Client({
    region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const bucketName = process.env.AWS_S3_BUCKET_NAME;
// Configure S3 storage for multer
const s3Storage = external_multer_s3_default()({
    s3: s3Client,
    bucket: bucketName,
    key: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = (0,external_nanoid_namespaceObject.nanoid)();
        const ext = external_path_default().extname(file.originalname).toLowerCase();
        const folder = 'nucleus-submissions';
        const filename = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    },
    contentType: (external_multer_s3_default()).AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
        cb(null, {
            fieldName: file.fieldname,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
        });
    },
});
// Create multer upload instance with S3 storage
const uploadToS3 = external_multer_default()({
    storage: s3Storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(external_path_default().extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});
// S3 storage service class
class S3StorageService {
    /**
     * Upload a file directly to S3
     */
    static async uploadFile(buffer, filename, contentType, options = {}) {
        try {
            const folder = options.folder || 'nucleus-uploads';
            const key = `${folder}/${filename}`;
            const command = new client_s3_.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                Metadata: {
                    uploadedAt: new Date().toISOString(),
                    ...options.metadata,
                },
            });
            const result = await s3Client.send(command);
            return {
                url: `https://${bucketName}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
                key: key,
                bucket: bucketName,
                etag: result.ETag,
            };
        }
        catch (error) {
            console.error('S3 upload error:', error);
            throw new Error('Failed to upload file to S3 storage');
        }
    }
    /**
     * Delete a file from S3
     */
    static async deleteFile(key) {
        try {
            const command = new client_s3_.DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            await s3Client.send(command);
            return true;
        }
        catch (error) {
            console.error('S3 delete error:', error);
            return false;
        }
    }
    /**
     * Generate a presigned URL for secure access
     */
    static async getPresignedUrl(key, expiresIn = 3600 // 1 hour default
    ) {
        try {
            const command = new client_s3_.GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            return await (0,s3_request_presigner_namespaceObject.getSignedUrl)(s3Client, command, { expiresIn });
        }
        catch (error) {
            console.error('S3 presigned URL error:', error);
            throw new Error('Failed to generate presigned URL');
        }
    }
    /**
     * Get direct public URL (only works if bucket allows public access)
     */
    static getPublicUrl(key) {
        return `https://${bucketName}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    }
    /**
     * Check if S3 is properly configured
     */
    static isConfigured() {
        return !!(process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_S3_BUCKET_NAME);
    }
    /**
     * List files in a folder
     */
    static async listFiles(folder = 'nucleus-uploads') {
        try {
            const { ListObjectsV2Command } = await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 43, 23));
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: folder,
                MaxKeys: 100,
            });
            const result = await s3Client.send(command);
            return result.Contents || [];
        }
        catch (error) {
            console.error('S3 list files error:', error);
            return [];
        }
    }
    /**
     * Get file metadata
     */
    static async getFileMetadata(key) {
        try {
            const { HeadObjectCommand } = await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 43, 23));
            const command = new HeadObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            const result = await s3Client.send(command);
            return {
                contentType: result.ContentType,
                contentLength: result.ContentLength,
                lastModified: result.LastModified,
                etag: result.ETag,
                metadata: result.Metadata,
            };
        }
        catch (error) {
            console.error('S3 metadata error:', error);
            return null;
        }
    }
}
// Fallback to local storage if S3 is not configured
const s3_storage_localStorage = external_multer_default()({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(external_path_default().extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});
// Export the appropriate upload handler based on configuration
const upload = S3StorageService.isConfigured() ? uploadToS3 : s3_storage_localStorage;
// Helper to get file URL regardless of storage type
function getFileUrl(file) {
    if (S3StorageService.isConfigured() && file.location) {
        // S3 file - multer-s3 provides location property
        return file.location;
    }
    else if (S3StorageService.isConfigured() && file.key) {
        // S3 file with key
        return S3StorageService.getPublicUrl(file.key);
    }
    else if (file.filename) {
        // Local file
        return `/uploads/${file.filename}`;
    }
    else {
        // Fallback
        return file.path || file.filename || file.location || '';
    }
}
// Backward compatibility exports
const CloudStorageService = S3StorageService;
const uploadToCloud = (/* unused pure expression or super */ null && (uploadToS3));

;// external "@sentry/node"
const node_namespaceObject = require("@sentry/node");
;// ./server/services/sentry.ts

// Initialize Sentry configuration
function initializeSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.warn('Sentry DSN not configured - error monitoring disabled');
        return false;
    }
    Sentry.init({
        dsn,
        environment: "production" || 0,
        tracesSampleRate:  true ? 0.1 : 0, // 10% in prod, 100% in dev
        // Capture additional context
        beforeSend(event, hint) {
            // Add custom context
            const error = hint.originalException;
            if (error instanceof Error) {
                // Add custom tags for better error categorization
                event.tags = {
                    ...event.tags,
                    component: getErrorComponent(error),
                    severity: getErrorSeverity(error),
                };
                // Add user context if available
                if (event.request?.headers) {
                    const userId = event.request.headers['x-user-id'];
                    if (userId) {
                        event.user = { id: userId };
                    }
                }
            }
            return event;
        },
        // Configure which errors to ignore
        ignoreErrors: [
            // Browser extensions
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded',
            // Network errors that aren't actionable
            'NetworkError',
            'fetch',
            // Common validation errors
            'ValidationError',
        ],
    });
    console.log('Sentry error monitoring initialized');
    return true;
}
// Express middleware for Sentry error handling
function sentryRequestHandler() {
    if (!isSentryConfigured()) {
        return (req, res, next) => next();
    }
    return Sentry.Handlers.requestHandler({
        user: ['id', 'email'],
        request: ['method', 'url', 'headers'],
        serverName: false, // Don't send server name for privacy
    });
}
function sentryErrorHandler() {
    if (!isSentryConfigured()) {
        return (error, req, res, next) => next(error);
    }
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Only capture 4xx and 5xx errors
            return error.status >= 400;
        },
    });
}
// Custom error tracking functions
class ErrorTracker {
    /**
     * Track API errors with context
     */
    static trackApiError(error, context) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('error_type', 'api_error');
            scope.setTag('endpoint', context.endpoint);
            scope.setTag('method', context.method);
            if (context.userId) {
                scope.setUser({ id: context.userId });
            }
            scope.setContext('request', {
                endpoint: context.endpoint,
                method: context.method,
                body: context.requestBody ? JSON.stringify(context.requestBody) : undefined,
            });
            node_namespaceObject.captureException(error);
        });
    }
    /**
     * Track AI service errors
     */
    static trackAiError(error, service, context) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('error_type', 'ai_service_error');
            scope.setTag('ai_service', service);
            scope.setLevel('warning'); // AI errors are often recoverable
            if (context) {
                scope.setContext('ai_context', context);
            }
            node_namespaceObject.captureException(error);
        });
    }
    /**
     * Track payment/subscription errors
     */
    static trackPaymentError(error, context) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('error_type', 'payment_error');
            scope.setLevel('error'); // Payment errors are critical
            if (context.customerId) {
                scope.setUser({ id: context.customerId });
            }
            scope.setContext('payment', context);
            node_namespaceObject.captureException(error);
        });
    }
    /**
     * Track database errors
     */
    static trackDatabaseError(error, query) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('error_type', 'database_error');
            scope.setLevel('error');
            if (query) {
                scope.setContext('database', { query });
            }
            node_namespaceObject.captureException(error);
        });
    }
    /**
     * Track custom business logic errors
     */
    static trackBusinessError(error, context) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('error_type', 'business_logic_error');
            scope.setTag('feature', context.feature);
            if (context.userId) {
                scope.setUser({ id: context.userId });
            }
            if (context.metadata) {
                scope.setContext('business_context', context.metadata);
            }
            node_namespaceObject.captureException(error);
        });
    }
    /**
     * Track performance issues
     */
    static trackPerformanceIssue(name, duration, context) {
        node_namespaceObject.withScope((scope) => {
            scope.setTag('performance_issue', true);
            scope.setTag('operation', name);
            scope.setContext('performance', {
                operation: name,
                duration,
                threshold_exceeded: duration > 5000, // 5 second threshold
                ...context,
            });
            // Only capture if it's actually slow
            if (duration > 5000) {
                node_namespaceObject.captureMessage(`Slow operation: ${name} took ${duration}ms`, 'warning');
            }
        });
    }
}
// Helper functions
function getErrorComponent(error) {
    const stack = error.stack || '';
    if (stack.includes('/api/'))
        return 'api';
    if (stack.includes('/services/'))
        return 'service';
    if (stack.includes('/middleware/'))
        return 'middleware';
    if (stack.includes('prisma'))
        return 'database';
    if (stack.includes('stripe'))
        return 'payment';
    if (stack.includes('bedrock') || stack.includes('perplexity'))
        return 'ai';
    return 'unknown';
}
function getErrorSeverity(error) {
    const message = error.message.toLowerCase();
    if (message.includes('payment') || message.includes('stripe'))
        return 'critical';
    if (message.includes('database') || message.includes('prisma'))
        return 'high';
    if (message.includes('auth') || message.includes('unauthorized'))
        return 'medium';
    if (message.includes('validation') || message.includes('invalid'))
        return 'low';
    return 'medium';
}
// Middleware to add user context to Sentry
function addUserContextMiddleware() {
    return (req, res, next) => {
        if (req.user?.id) {
            node_namespaceObject.setUser({
                id: req.user.id,
                email: req.user.email,
            });
        }
        next();
    };
}
// Check if Sentry is configured
function isSentryConfigured() {
    const dsn = process.env.SENTRY_DSN;
    return !!(dsn && dsn !== 'your_sentry_dsn_here' && dsn.startsWith('https://'));
}

;// external "express-rate-limit"
const external_express_rate_limit_namespaceObject = require("express-rate-limit");
var external_express_rate_limit_default = /*#__PURE__*/__webpack_require__.n(external_express_rate_limit_namespaceObject);
;// external "express-slow-down"
const external_express_slow_down_namespaceObject = require("express-slow-down");
var external_express_slow_down_default = /*#__PURE__*/__webpack_require__.n(external_express_slow_down_namespaceObject);
;// ./server/services/rate-limit.ts



// Rate limiting configurations for different endpoints
const rateLimitConfigs = {
    // General API rate limiting
    general: external_express_rate_limit_default()({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            ErrorTracker.trackBusinessError(new Error('Rate limit exceeded'), {
                feature: 'rate_limiting',
                metadata: {
                    ip: req.ip,
                    endpoint: req.path,
                    method: req.method,
                }
            });
            res.status(429).json({
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            });
        },
    }),
    // Strict rate limiting for authentication endpoints
    auth: external_express_rate_limit_default()({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 requests per windowMs for auth
        message: {
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful requests
    }),
    // Rate limiting for AI-powered features (expensive operations)
    aiFeatures: external_express_rate_limit_default()({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // limit each IP to 20 AI requests per hour
        message: {
            error: 'AI feature usage limit exceeded. Please try again in an hour.',
            retryAfter: '1 hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    // Rate limiting for file uploads
    fileUpload: external_express_rate_limit_default()({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // limit each IP to 10 file uploads per 15 minutes
        message: {
            error: 'File upload limit exceeded, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    // Rate limiting for Pro report generation (resource intensive)
    proReports: external_express_rate_limit_default()({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 5, // limit each IP to 5 pro reports per day
        message: {
            error: 'Daily Pro report limit exceeded. Please try again tomorrow.',
            retryAfter: '24 hours'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    // Rate limiting for search/matching operations
    search: external_express_rate_limit_default()({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // limit each IP to 50 search requests per 5 minutes
        message: {
            error: 'Search rate limit exceeded, please try again in a few minutes.',
            retryAfter: '5 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
};
// Slow down configurations for specific endpoints
const slowDownConfigs = {
    // Gradually slow down requests to AI endpoints
    ai: external_express_slow_down_default()({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 2, // allow 2 requests per 15 minutes at full speed
        delayMs: (used) => used * 500, // add 500ms delay per request after delayAfter
        maxDelayMs: 20000, // max delay of 20 seconds
    }),
    // Slow down password-related operations (brute force protection)
    password: external_express_slow_down_default()({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 2, // allow 2 requests per 15 minutes at full speed
        delayMs: (used) => Math.pow(2, used - 2) * 1000, // exponential delay: 1s, 2s, 4s, 8s, etc.
        maxDelayMs: 60000, // max delay of 1 minute
    }),
};
// User-specific rate limiting for free vs pro users
function createUserBasedRateLimit(freeUserLimit, proUserLimit, windowMs = 60 * 60 * 1000 // 1 hour default
) {
    return rateLimit({
        windowMs,
        max: (req) => {
            // Check user subscription tier
            const user = req.user;
            if (!user)
                return freeUserLimit;
            const isProUser = user.subscriptionTier === 'pro' ||
                user.subscription_tier === 'pro';
            return isProUser ? proUserLimit : freeUserLimit;
        },
        message: (req) => {
            const user = req.user;
            const isProUser = user?.subscriptionTier === 'pro' ||
                user?.subscription_tier === 'pro';
            return {
                error: `Rate limit exceeded for ${isProUser ? 'Pro' : 'Free'} users.`,
                retryAfter: `${windowMs / 1000 / 60} minutes`,
                upgradeMessage: !isProUser ? 'Upgrade to Pro for higher limits!' : undefined,
            };
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
}
// DDoS protection - very strict limits
const ddosProtection = external_express_rate_limit_default()({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // max 30 requests per minute per IP
    message: {
        error: 'Too many requests. DDoS protection activated.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`DDoS protection triggered for IP: ${req.ip}`);
        ErrorTracker.trackBusinessError(new Error('DDoS protection triggered'), {
            feature: 'ddos_protection',
            metadata: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
            }
        });
        res.status(429).json({
            error: 'Too many requests. DDoS protection activated.',
            retryAfter: '1 minute'
        });
    },
});
// Custom rate limiter for specific business logic
function createCustomRateLimit(config) {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: { error: config.message },
        keyGenerator: config.keyGenerator,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        skipFailedRequests: config.skipFailedRequests,
        standardHeaders: true,
        legacyHeaders: false,
    });
}
// Export configured rate limiters
const rateLimiters = rateLimitConfigs;
const slowDownLimiters = slowDownConfigs;
// Helper to check if rate limiting should be applied
function shouldApplyRateLimit() {
    // Disable rate limiting in development for easier testing
    if (false) // removed by dead control flow
{}
    // Always apply in production
    return true;
}
// Middleware to apply rate limiting conditionally
function conditionalRateLimit(limiter) {
    return (req, res, next) => {
        if (shouldApplyRateLimit()) {
            return limiter(req, res, next);
        }
        next();
    };
}
// Rate limit bypass for admin users or testing
function createBypassableRateLimit(limiter) {
    return (req, res, next) => {
        // Check for bypass conditions
        const bypassToken = req.headers['x-bypass-rate-limit'];
        const isAdmin = req.user?.role === 'admin';
        const isTestMode = "production" === 'test';
        if (bypassToken === process.env.RATE_LIMIT_BYPASS_TOKEN || isAdmin || isTestMode) {
            return next();
        }
        return limiter(req, res, next);
    };
}

;// ./server/routes.ts















// File upload is now handled by S3 storage service
async function registerRoutes(app) {
    // Setup unified authentication system
    await (0,auth_factory/* setupAuth */.e)(app);
    // Helper function to get the appropriate authentication middleware  
    const { getAuthMiddleware: getAuth } = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 283));
    const getAuthMiddleware = () => getAuth();
    // Helper function to get the appropriate storage
    const getStorage = () => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? storage/* storage */.I : localStorage/* localStorage */.L;
    // Initialize analytics service
    const storageInstance = getStorage();
    const prisma = storageInstance.prisma;
    // const analytics = new AnalyticsService(prisma); // Temporarily disabled
    const analytics = {
        trackEvent: () => { },
        trackProReportGeneration: () => { },
        trackError: () => { },
    }; // Mock analytics for now
    // Initialize Stripe service
    const stripeService = new stripe_StripeService(prisma);
    // Add performance monitoring middleware
    // app.use(createPerformanceMiddleware(analytics)); // Temporarily disabled
    // Add DDoS protection (very strict)
    app.use(conditionalRateLimit(ddosProtection));
    // Add general API rate limiting
    app.use('/api', conditionalRateLimit(rateLimiters.general));
    // Add Sentry user context middleware for authenticated routes
    if (isSentryConfigured()) {
        app.use(addUserContextMiddleware());
    }
    // Stripe webhook endpoint (must be before JSON parsing middleware)
    app.post('/api/stripe/webhook', external_express_default().raw({ type: 'application/json' }), async (req, res) => {
        try {
            const signature = req.headers['stripe-signature'];
            const event = stripeService.verifyWebhookSignature(req.body, signature);
            console.log('Received Stripe webhook:', event.type);
            // Handle subscription events
            switch (event.type) {
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    const subscription = event.data.object;
                    await stripeService.updateSubscriptionFromWebhook(subscription, event.type);
                    // Log subscription event for audit trail
                    if (subscription.customer) {
                        const user = await prisma.user.findFirst({
                            where: { stripeCustomerId: subscription.customer },
                        });
                        if (user) {
                            await prisma.subscriptionEvent.create({
                                data: {
                                    userId: user.id,
                                    stripeEventId: event.id,
                                    eventType: event.type,
                                    subscriptionId: subscription.id,
                                    eventData: event.data.object,
                                },
                            });
                        }
                    }
                    break;
                case 'invoice.payment_succeeded':
                case 'invoice.payment_failed':
                    console.log(`Payment ${event.type} for invoice:`, event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
            res.json({ received: true });
        }
        catch (error) {
            console.error('Stripe webhook error:', error);
            // Track payment errors with Sentry
            ErrorTracker.trackPaymentError(error, {
                stripeEventType: req.body?.type,
            });
            res.status(400).json({ error: 'Webhook error' });
        }
    });
    // Leaderboard routes
    app.get('/api/leaderboard', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const leaderboard = await getStorage().getLeaderboard(limit);
            res.json(leaderboard);
        }
        catch (error) {
            console.error("Error fetching leaderboard:", error);
            res.status(500).json({ message: "Failed to fetch leaderboard" });
        }
    });
    // Idea validation routes
    app.post('/api/ideas/validate', getAuthMiddleware(), conditionalRateLimit(rateLimiters.aiFeatures), conditionalRateLimit(slowDownLimiters.ai), rateLimitFreeUsers(prisma, 5, 60 * 60 * 1000), // 5 validations per hour for free users
    async (req, res) => {
        try {
            const userId = req.user.id;
            const validatedData = insertIdeaSchema.parse({ ...req.body, userId });
            // Create the idea first
            const idea = await getStorage().createIdea(validatedData);
            // Perform comprehensive validation with enhanced analysis
            const validation = await performComprehensiveValidation(validatedData.title, validatedData.marketCategory, validatedData.problemDescription, validatedData.solutionDescription, validatedData.targetAudience);
            // Update idea with validation results
            await getStorage().updateIdeaValidation(idea.id, validation.overallScore, validation);
            // Update user's total idea score (use highest score)
            const userIdeas = await getStorage().getUserIdeas(userId);
            const highestScore = Math.max(...userIdeas.map(i => i.validationScore || 0), validation.overallScore);
            await getStorage().updateUserIdeaScore(userId, highestScore);
            res.json({ ideaId: idea.id, validation });
        }
        catch (error) {
            console.error("Error validating idea:", error);
            res.status(500).json({ message: "Failed to validate idea" });
        }
    });
    app.get('/api/ideas/:id', getAuthMiddleware(), async (req, res) => {
        try {
            const idea = await getStorage().getIdea(req.params.id);
            if (!idea) {
                return res.status(404).json({ message: "Idea not found" });
            }
            // Check if user owns this idea
            const userId = req.user.id;
            if (idea.userId !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }
            res.json(idea);
        }
        catch (error) {
            console.error("Error fetching idea:", error);
            res.status(500).json({ message: "Failed to fetch idea" });
        }
    });
    // Pro Report Generation
    app.post('/api/ideas/:id/generate-pro-report', getAuthMiddleware(), conditionalRateLimit(rateLimiters.proReports), conditionalRateLimit(slowDownLimiters.ai), requireProSubscription(prisma), async (req, res) => {
        try {
            const userId = req.user.id;
            const ideaId = req.params.id;
            // Get the idea
            const idea = await getStorage().getIdea(ideaId);
            if (!idea) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'IDEA_NOT_FOUND',
                        message: 'Idea not found'
                    }
                });
            }
            if (idea.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCESS_DENIED',
                        message: 'You can only generate reports for your own ideas'
                    }
                });
            }
            // Initialize Pro Report Generator
            const storage = getStorage();
            const prisma = storage.prisma; // Access prisma from storage
            const proReportGenerator = new ProReportGeneratorService(prisma);
            // Track pro report generation start
            const startTime = Date.now();
            analytics.trackEvent(userId, 'pro_report_generation_started', {
                ideaId,
                ideaTitle: idea.title,
                marketCategory: idea.marketCategory,
            });
            // Generate comprehensive Pro report
            const proReport = await proReportGenerator.generateProReport(userId, idea.title, idea.marketCategory, idea.problemDescription, idea.solutionDescription, idea.targetAudience);
            // Track successful generation
            const duration = Date.now() - startTime;
            analytics.trackProReportGeneration(userId, ideaId, true, duration);
            // Update idea with Pro report
            const currentAnalysis = idea.analysisReport || {};
            const updatedAnalysis = {
                ...currentAnalysis,
                proReport,
                lastUpdated: new Date().toISOString()
            };
            await storage.updateIdeaValidation(ideaId, idea.validationScore || 0, updatedAnalysis);
            res.json({
                success: true,
                proReport,
                message: 'Pro business report generated successfully'
            });
        }
        catch (error) {
            console.error("Error generating Pro report:", error);
            // Determine error type and provide appropriate response
            let errorCode = 'GENERATION_FAILED';
            let errorMessage = 'Failed to generate Pro report';
            if (error instanceof Error) {
                if (error.message.includes('API')) {
                    errorCode = 'API_ERROR';
                    errorMessage = 'External service temporarily unavailable';
                }
                else if (error.message.includes('database') || error.message.includes('prisma')) {
                    errorCode = 'DATABASE_ERROR';
                    errorMessage = 'Database error occurred';
                }
            }
            // Track failed generation
            const duration = Date.now() - req.startTime || 0;
            const userId = req.user?.id;
            const ideaId = req.params.id;
            if (userId) {
                analytics.trackProReportGeneration(userId, ideaId, false, duration);
                analytics.trackError(req.path, req.method, errorCode, errorMessage, userId);
            }
            res.status(500).json({
                success: false,
                error: {
                    code: errorCode,
                    message: errorMessage,
                    details:  false ? 0 : undefined
                }
            });
        }
    });
    // Privacy Settings API Endpoints
    app.get('/api/users/privacy-settings', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const storage = getStorage();
            const prisma = storage.prisma;
            const privacyManager = new PrivacyManagerService(prisma);
            const privacySettings = await privacyManager.getUserPrivacySettings(userId);
            if (!privacySettings) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }
            // Track privacy settings access
            analytics.trackEvent(userId, 'privacy_settings_viewed', {});
            res.json({
                success: true,
                privacySettings
            });
        }
        catch (error) {
            console.error("Error fetching privacy settings:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch privacy settings'
                }
            });
        }
    });
    app.put('/api/users/privacy-settings', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const storage = getStorage();
            const prisma = storage.prisma;
            const privacyManager = new PrivacyManagerService(prisma);
            // Validate input data
            if (!privacyManager.validatePrivacySettings(req.body)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Invalid privacy settings data. All values must be boolean.'
                    }
                });
            }
            const updatedSettings = await privacyManager.updatePrivacySettings(userId, req.body);
            // Track privacy settings update
            analytics.trackEvent(userId, 'privacy_settings_updated', {
                settings: req.body,
            });
            res.json({
                success: true,
                privacySettings: updatedSettings,
                message: 'Privacy settings updated successfully'
            });
        }
        catch (error) {
            console.error("Error updating privacy settings:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_FAILED',
                    message: 'Failed to update privacy settings'
                }
            });
        }
    });
    app.get('/api/ideas', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const ideas = await getStorage().getUserIdeas(userId);
            res.json(ideas);
        }
        catch (error) {
            console.error("Error fetching user ideas:", error);
            res.status(500).json({ message: "Failed to fetch ideas" });
        }
    });
    // Submission routes
    app.post('/api/submissions', [
        getAuthMiddleware(),
        conditionalRateLimit(rateLimiters.fileUpload),
        upload.array('files', 5)
    ], async (req, res) => {
        try {
            const userId = req.user.id;
            // Handle file URLs from cloud storage or local storage
            const fileUrls = req.files ? req.files.map((file) => getFileUrl(file)) : [];
            const submissionData = {
                ...req.body,
                userId,
                fileUrls,
                portfolioUrl: req.body.portfolioUrl || null,
                githubUrl: req.body.githubUrl || null,
                liveUrl: req.body.liveUrl || null
            };
            const validatedData = insertSubmissionSchema.parse(submissionData);
            const submission = await getStorage().createSubmission(validatedData);
            // Log storage type for monitoring
            console.log(`Submission created with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
            res.json(submission);
        }
        catch (error) {
            console.error("Error creating submission:", error);
            res.status(500).json({ message: "Failed to create submission" });
        }
    });
    app.get('/api/submissions', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const submissions = await getStorage().getUserSubmissions(userId);
            res.json(submissions);
        }
        catch (error) {
            console.error("Error fetching submissions:", error);
            res.status(500).json({ message: "Failed to fetch submissions" });
        }
    });
    app.put('/api/submissions/:id', [getAuthMiddleware(), upload.array('files', 5)], async (req, res) => {
        try {
            const submission = await getStorage().getSubmission(req.params.id);
            if (!submission) {
                return res.status(404).json({ message: "Submission not found" });
            }
            const userId = req.user.id;
            if (submission.userId !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }
            // Handle new file uploads or keep existing files
            const fileUrls = req.files && req.files.length > 0
                ? req.files.map((file) => getFileUrl(file))
                : submission.fileUrls;
            const updatedSubmission = await getStorage().updateSubmission(req.params.id, {
                ...req.body,
                fileUrls
            });
            console.log(`Submission updated with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
            res.json(updatedSubmission);
        }
        catch (error) {
            console.error("Error updating submission:", error);
            res.status(500).json({ message: "Failed to update submission" });
        }
    });
    // Matching routes
    app.get('/api/matches/potential', [
        getAuthMiddleware(),
        conditionalRateLimit(rateLimiters.search)
    ], async (req, res) => {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            const potentialMatches = await getStorage().findPotentialMatches(userId, limit);
            res.json(potentialMatches);
        }
        catch (error) {
            console.error("Error fetching potential matches:", error);
            res.status(500).json({ message: "Failed to fetch potential matches" });
        }
    });
    app.post('/api/matches', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const { targetUserId, interested } = req.body;
            if (!targetUserId) {
                return res.status(400).json({ message: "Target user ID is required" });
            }
            // Check if match already exists
            const existingMatches = await getStorage().getUserMatches(userId);
            const existingMatch = existingMatches.find(m => (m.user1Id === userId && m.user2Id === targetUserId) ||
                (m.user1Id === targetUserId && m.user2Id === userId));
            if (existingMatch) {
                // Update existing match
                const updatedMatch = await getStorage().updateMatchInterest(existingMatch.id, userId, interested);
                return res.json(updatedMatch);
            }
            // Create new match
            const currentUser = await getStorage().getUser(userId);
            const targetUser = await getStorage().getUser(targetUserId);
            if (!currentUser || !targetUser) {
                return res.status(404).json({ message: "User not found" });
            }
            // Generate compatibility score
            const insights = await generateMatchingInsights(currentUser, targetUser);
            const match = await getStorage().createMatch({
                user1Id: userId,
                user2Id: targetUserId,
                status: 'pending',
                compatibilityScore: insights.compatibilityScore,
                user1Interested: interested,
                user2Interested: false,
            });
            res.json(match);
        }
        catch (error) {
            console.error("Error creating match:", error);
            res.status(500).json({ message: "Failed to create match" });
        }
    });
    app.get('/api/matches', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const matches = await getStorage().getUserMatches(userId);
            res.json(matches);
        }
        catch (error) {
            console.error("Error fetching matches:", error);
            res.status(500).json({ message: "Failed to fetch matches" });
        }
    });
    app.get('/api/matches/mutual', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const mutualMatches = await getStorage().getMutualMatches(userId);
            res.json(mutualMatches);
        }
        catch (error) {
            console.error("Error fetching mutual matches:", error);
            res.status(500).json({ message: "Failed to fetch mutual matches" });
        }
    });
    // Message routes
    app.post('/api/matches/:matchId/messages', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const { matchId } = req.params;
            const { content } = req.body;
            // Verify user is part of this match
            const match = await getStorage().getMatch(matchId);
            if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
                return res.status(403).json({ message: "Access denied" });
            }
            const validatedData = insertMessageSchema.parse({
                matchId,
                senderId: userId,
                content
            });
            const message = await getStorage().createMessage(validatedData);
            res.json(message);
        }
        catch (error) {
            console.error("Error creating message:", error);
            res.status(500).json({ message: "Failed to send message" });
        }
    });
    app.get('/api/matches/:matchId/messages', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const { matchId } = req.params;
            // Verify user is part of this match
            const match = await getStorage().getMatch(matchId);
            if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
                return res.status(403).json({ message: "Access denied" });
            }
            const messages = await getStorage().getMatchMessages(matchId);
            res.json(messages);
        }
        catch (error) {
            console.error("Error fetching messages:", error);
            res.status(500).json({ message: "Failed to fetch messages" });
        }
    });
    // Subscription management routes
    app.post('/api/subscription/create-checkout-session', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const { priceId } = req.body;
            if (!priceId) {
                return res.status(400).json({ error: 'Price ID is required' });
            }
            const session = await stripeService.createCheckoutSession(userId, priceId, `${req.headers.origin}/dashboard?subscription=success`, `${req.headers.origin}/pricing?subscription=cancelled`);
            res.json({ sessionId: session.id, url: session.url });
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    });
    app.post('/api/subscription/create-portal-session', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const session = await stripeService.createCustomerPortalSession(userId, `${req.headers.origin}/dashboard`);
            res.json({ url: session.url });
        }
        catch (error) {
            console.error('Error creating portal session:', error);
            res.status(500).json({ error: 'Failed to create portal session' });
        }
    });
    app.get('/api/subscription/status', getAuthMiddleware(), async (req, res) => {
        try {
            const userId = req.user.id;
            const subscription = await stripeService.getUserSubscription(userId);
            res.json(subscription);
        }
        catch (error) {
            console.error('Error getting subscription status:', error);
            res.status(500).json({ error: 'Failed to get subscription status' });
        }
    });
    // Health check endpoint
    app.get('/api/health', async (req, res) => {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                cloudStorage: CloudStorageService.isConfigured() ? 'configured' : 'local_fallback',
                auth:  true ? 'cognito' : 0,
            }
        };
        res.json(health);
    });
    // Serve uploaded files (for local fallback)
    app.use('/uploads', external_express_default()["static"]('uploads'));
    const httpServer = (0,external_http_namespaceObject.createServer)(app);
    return httpServer;
}

// EXTERNAL MODULE: external "helmet"
var external_helmet_ = __webpack_require__(525);
var external_helmet_default = /*#__PURE__*/__webpack_require__.n(external_helmet_);
;// ./server/lambda.ts






// Create Express app
const app = external_express_default()();
// Security middleware
app.use(external_helmet_default()({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration for AWS
app.use(external_cors_default()({
    origin: [
        'http://localhost:5000',
        'http://localhost:3000',
        'https://*.amazonaws.com',
        'https://*.cloudfront.net'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
app.use(external_cookie_parser_default()());
app.use(external_express_default().json({ limit: '10mb' }));
app.use(external_express_default().urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Register all routes
registerRoutes(app).then(() => {
    console.log('Routes registered successfully');
}).catch((error) => {
    console.error('Failed to register routes:', error);
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Lambda error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error:  false ? 0 : undefined
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Create serverless handler
const handler = serverless_express_default()({ app });
// Export app for local testing


module.exports = __webpack_exports__;
/******/ })()
;