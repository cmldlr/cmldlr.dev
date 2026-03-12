require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const emailjs = require('@emailjs/nodejs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Statik dosyaları sun (index.html, css, js vs.)
app.use(express.static(path.join(__dirname)));

// EmailJS SDK'yı başlat
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY || undefined,
});

app.post('/api/send-otp', async (req, res) => {
    try {
        const { email, otp_code } = req.body;

        if (!email || !otp_code) {
            return res.status(400).json({ error: 'Email and OTP code are required' });
        }

        console.log(`Sending OTP to ${email}...`);

        const result = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            {
                to_email: email,
                otp_code: String(otp_code),
                expiry_minutes: '5'
            }
        );

        console.log('EmailJS response:', result.status, result.text);
        return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error.status, error.text || error.message);
        return res.status(500).json({ error: error.text || 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
