const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

const comparePassword = async (password, hashedPassword) => {
    try {
        console.log(`Comparing password with hash...`);
        console.log(`Input password: ${password}`);
        console.log(`Hashed password: ${hashedPassword.substring(0, 20)}...`);
        
        const isMatch = await bcrypt.compare(password, hashedPassword);
        console.log(`Password comparison result: ${isMatch ? 'Match' : 'No match'}`);
        
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        console.error('Error stack:', error.stack);
        throw new Error('Error comparing passwords');
    }
};

module.exports = {
    hashPassword,
    comparePassword
};