// create token and saving that in cookies
const sendToken = (user, statusCode, res, rememberMe = false) => {
  const token = user.getJwtToken(rememberMe);

  const isProd = process.env.NODE_ENV?.toLowerCase() === "production";
  const options = {
     httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
   // httpOnly: true,
    //secure: process.env.NODE_ENV === "PRODUCTION",
    //sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
  };

  // only set an explicit expiry if "remember me" was checked.
  // Without "expires", the cookie becomes a session cookie — it gets
  // cleared automatically when the browser is fully closed.
  if (rememberMe) {
    options.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;