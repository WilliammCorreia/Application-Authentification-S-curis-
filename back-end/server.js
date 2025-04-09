require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const prisma = new PrismaClient();
const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Démarrer le serveur sur le même port
app.listen(3000, () => {
    console.log("Serveur démarré sur http://localhost:3000");
});

// Route qui permet d'inscrire un utilisateur
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Utilisateur déjà inscrit" });

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres

    // Création de l'utilisateur
    await prisma.user.create({
        data: { email, password: hashedPassword, code: verificationCode }
    });

    // Création du token JWT
    const token = generateJWT(email, false);

    // Sauvegarde du token dans le cookie
    res.cookie('jwt', token, {
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        maxAge: 3600000
    });

    // Réponse envoyé à l'utilisateur
    res.json({ message: "Utilisateur créé, code envoyé par email" });

    // Envoi de l'e-mail
    await sendEmail(email, verificationCode);
});

// Route qui permet de vérifier le code envoyé par l'utilisateur
app.post('/verify', async (req, res) => {
    const { code } = req.body;

    // Récupération du token depuis mon cookie
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Token manquant"})

    // Vérifie le token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(403).json({ message: "Token invalide ou expiré"});
    }

    // Récupération de l'email depuis le token
    const email = decoded.email;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.code !== code) return res.status(400).json({ message: "Code invalide" });

    await prisma.user.update({
        where: { email },
        data: { verified: true, code: null }
    });

    // Création du nouveau token
    const newToken = generateJWT(email, true);

    // Réécriture du cookie avec le nouveau token
    res.cookie('jwt', newToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000
    })

    res.json({ message: "Utilisateur authentifié" });
});

// Route qui permet de connecter un utilisateur
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.verified) return res.status(400).json({ message: "Utilisateur non vérifié ou inexistant" });

    // Vérifie si le mot de passe de l'utilisateur
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Générer un nouveau code de connexion
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { email }, data: { code: loginCode } });

    // Création du token JWT
    const token = generateJWT(email, false);

    // Sauvegarde du token dans le cookie
    res.cookie('jwt', token, {
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        maxAge: 3600000
    });

    // Réponse envoyé à l'utilisateur
    res.json({ message: "Code de connexion envoyé par email" });
    
    // Envoi de l'e-mail
    await sendEmail(email, loginCode);
});

// Route qui permet de déconnecter l'utilisateur
app.get('/logout', (req, res) => {

    // Sauvegarde du token dans le cookie
    res.clearCookie('jwt', {
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        path: '/'
    });

    // Réponse envoyé à l'utilisateur
    res.json({ message: "Déconnexion réussie" });
});

// Route qui permet de vérifier le token JWT de l'utilisateur
app.get('/checkJWT', (req, res) => {

    // Récupération du token depuis le cookie
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Token manquant"});

    // Vérifie le token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(403).json({ message: "Token invalide ou expiré"});
    }

    return res.json({ message: "Accès autorisé"});
});

// Route qui permet d'envoyer un mail avec un code à 6 chiffres à l'utilisateur
app.post('/forgetPwd', async (req, res) => {
    const { email } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.verified) return res.status(400).json({ message: "Utilisateur non vérifié ou inexistant" });

    // Générer un nouveau code de connexion
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { email }, data: { code: loginCode } });

    // Création du token JWT
    const token = generateJWT(email, false);

    // Sauvegarde du token dans le cookie
    res.cookie('jwt', token, {
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        maxAge: 3600000
    });

    // Réponse envoyé à l'utilisateur
    res.json({ message: "Code de connexion envoyé par email" });
    
    // Envoi de l'e-mail
    await sendEmail(email, loginCode);
});

// Route qui permet de réinitialiser le mot de passe de l'utilisateur
app.post('/resetPwd', async (req, res) => {
    const { password, code } = req.body;

    // Récupération du token depuis mon cookie
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Token manquant"})

    // Vérifie le token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(403).json({ message: "Token invalide ou expiré"});
    }

    // Récupération de l'email depuis le token
    const email = decoded.email;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.code !== code) return res.status(400).json({ message: "Code invalide" });

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mise à jour du mot de passe
    await prisma.user.update({ where: { email }, data: { code: null, password: hashedPassword } });

    // Création du token JWT
    const newToken = generateJWT(email, true);

    // Sauvegarde du token dans le cookie
    res.cookie('jwt', newToken, {
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        maxAge: 3600000
    });

    // Réponse envoyé à l'utilisateur
    res.json({ message: "Utilisateur créé, code envoyé par email" });
});

/**
 * Crée un transporteur pour l'envoi d'e-mails en utilisant Nodemailer.
 * 
 * Le transporteur est configuré pour utiliser les informations d'authentification
 * et les paramètres de connexion fournis via les variables d'environnement suivantes :
 * - MAILTRAP_HOST : l'hôte du serveur SMTP.
 * - MAILTRAP_PORT : le port du serveur SMTP.
 * - MAILTRAP_USER : le nom d'utilisateur pour l'authentification.
 * - MAILTRAP_PASS : le mot de passe pour l'authentification.
 * 
 * @constant {Object} transporter - Instance de transporteur Nodemailer configurée.
 */
const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

/**
 * Envoie un email contenant un code de vérification à un destinataire spécifié.
 *
 * @param {string} to - L'adresse email du destinataire.
 * @param {string} code - Le code de vérification à inclure dans l'email.
 * @returns {Promise<void>} Une promesse qui est résolue lorsque l'email est envoyé avec succès.
 * @throws {Error} Lance une erreur si l'envoi de l'email échoue.
 */
async function sendEmail(to, code) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to, 
            subject: "Votre code de vérification",
            text: `Votre code de vérification est : ${code}`
        });

        console.log("Email envoyé : ", info.messageId);
    } catch (error) {
        console.error("Erreur lors de l'envoi du mail :", error);
    }
}

/**
 * Permet de créer un token JWT avec comme information dans le payload l'email, 
 * et un booléen pour savoir si l'utilisateur est authentifié ou non.
 * 
 * @param {string} email - Email de l'utilisateur.
 * @param {boolean} authenticated - `true` l'utilisateur est authentifié, `false` l'utilisateur n'est pas authentifié.
 * @returns Retourne un token JWT.
 */
function generateJWT(email, authenticated = false) {
    const payload = {
        email, 
        authenticated
    }

    const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        {expiresIn: '1h'}
    );

    return token;
}