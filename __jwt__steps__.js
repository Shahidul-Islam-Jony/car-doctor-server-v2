/**
 * ------------------------
 * Make Api Secure
 * ------------------------
 * 
 * The person who should have
 * 
 * concept:
 * 1. assign two token for each person(access token, refresh token)
 * 2. access token contains : user identification (email,role, etc) valid for a shorter duration
 * 3. refresh token is used : to recreate an access token that was expired.
 * 4. if refresh is invalid then logout the user
 * 
 */

/**
 * 1. jwt--> json web token
 * 2.  generate a token by using jwt.sign
 * 3. create api set to cookie. httpOnly,secure,sameSite
 * 4. from client side: axios withCredentials true
 * 5. cors setup origin:[client site link] and credentials: true
 *  
 * */

/**
 * 1. for secure api calls
 * 2. server side: install cookie parser and use it as a middleware
 * 3. req.cookies
 * 4. on client side: make api call using axios withCredentials: true or if using fetch credentials:'include'
 * 
 * 
*/