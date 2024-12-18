import express, { response } from "express";
import bcrypt, { hash } from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import { User } from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "sayuminelithma@gmail.com",
        pass: "xfzw rmmk lvrf xyve", // Make sure to use an environment variable for security
    },
});

router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashPassword,
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.KEY, {
            expiresIn: "7d",
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, //milisecs
        });

        //Create a transporter for sending emails
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sayuminelithma@gmail.com",
                pass: "xfzw rmmk lvrf xyve",
            },
        });

        // Send the welcome email
        const mailOptions = {
            from: "sayuminelithma@gmail.com",
            to: email,
            subject: "Welcome!",
            text: `Hi ${username} welcome to our website. Your account was created.
            Your login credentials are as follow:

                            Email: ${email}
                            Password: ${password}

            Use this login credentials to access our website.
                        
            Thank You!`,

        };

        await transporter.sendMail(mailOptions);

        res
            .status(201)
            .json({ success: true, message: "User registered successfully" });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Validate request data
    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Email and password are required." });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User is not registered." });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Password is incorrect." });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.KEY, {
            expiresIn: "7d",
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, //milisecs
        });

        return res.status(200).json({ success: true, message: "Login successful" });
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
});

router.post("/logout", async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.json({ success: true, message: "Logged Out" });
    } catch (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
});

const userAuth = async (req, res, next) => {
    const {token} = req.cookies;

    if (!token) {
        return res.json({ success: false, message: "Not Authorized! Login again" });
    }

    try{
        const tokenDecode = jwt.verify(token, process.env.KEY);

        if(tokenDecode.id) {
            req.body.userID = tokenDecode.id
        }else {
            return res.json({ success: false, message: "Not Authirized! Login again" });
        }

        next();

    }catch(err) {
        return res.json({ success: false, message: err.message});
    }
};

//send verify otp
router.post('/send-verify-OTP', userAuth, async (req, res) => {
    try {
        const {userID} = req.body;

        const user = await User.findById(userID);

        if(user.isAccountVerified) {
            return res.json({success: false, message: "Account already verified"})
        }

        const OTP = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOTP = OTP;
        user.verifyOTPexpireAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: "sayuminelithma@gmail.com",
            to: user.email,
            subject: "Account verification OTP",
            text: `Your OTP is ${OTP}. Verify your account using this OTP.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "Verification OTP sent on Email" });

    } catch(error) {
        console.error("Error", error);
        res.status(500).json({ message: "Internal server error" });

    }
});

//verify email using OTP
router.post('/verify-account', userAuth, async (req, res) => {

    const {userID, OTP} = req.body;

    if(!userID || !OTP) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try{
        const user = await User.findById(userID);

        if(!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if(user.verifyOTP === '' || user.verifyOTP !== OTP) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if(user.verifyOTPexpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOTP = '';
        user.verifyOTPexpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verified successfully" });

    }catch(error) {
        return res.json({ success: false, message: error.message });
    }
});

//check if user is authenticated
router.get('/is-auth', userAuth, async (req, res) => {
    try{
        return res.json({ success: true, message: "User is authenticated" });

    }catch (error) {
        return res.json({ success: false, message: error.message });

    }

});

//send password reset OTP
router.post('/send-reset-OTP', async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.json({ success: false, message: "Email is required" });   
    }

    try {
        const user = await User.findOne({email});

        if(!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const OTP = String(Math.floor(100000 + Math.random() * 900000));

        user.ResetOTP = OTP;
        user.resetOTPexpireAt = Date.now() + 15 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: "sayuminelithma@gmail.com",
            to: user.email,
            subject: "Password Reset OTP",
            text: `Your OTP for resetting your password is ${OTP}. Reset your Password using this OTP.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "Password resetting OTP sent on Email" });


    }catch(err) {
        return res.json({ success: false, message: err.message});
    }

});

//reset user password
router.post('/reset-password', async (req, res) => {
    const {email, OTP, newPassword} = req.body;

    if(!email || !OTP || !newPassword){
        return res.json({ success: false, message: "Email, OTP and New Password are required" });
    }

    try{
        const user = await User.findOne({email});

        if(!user){
            return res.json({ success: false, message: "User not found" });
        }

        if(user.ResetOTP === "" || user.ResetOTP !== OTP) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if(user.resetOTPexpireAt < Date.now()){
            return res.json({ success: false, message: "OTP expired" });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashPassword;
        user.ResetOTP = '';
        user.resetOTPexpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Password has been reset successfully" });

    }catch(err){
        return res.json({ success: false, message: err.message });
    }

});


//get user data
router.get('/data', userAuth, async (req, res) => {

    try{
        const {userID} = req.body;

        const user = await User.findById(userID);

        if(!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ 
            success: true,
            userData: {
                username: user.username,
                isAccountVerified: user.isAccountVerified,
            }

        });

    }catch(err){
        return res.json({ success: false, message: err.message });
    }


});

export default transporter;
export { router as UserRouter };
