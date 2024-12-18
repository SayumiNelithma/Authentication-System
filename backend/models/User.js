import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Invalid email format'],
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    verifyOTP: {
        type: String,
        default: '',

    },

    verifyOTPexpireAt: {
        type: Number,
        default: 0,

    },

    isAccountVerified: {
        type: Boolean,
        default: false,

    },

    ResetOTP: {
        type: String,
        default: '',

    },

    resetOTPexpireAt: {
        type: Number,
        default: 0,

    },
});

const UserModel = mongoose.model('User', UserSchema);

export { UserModel as User };
