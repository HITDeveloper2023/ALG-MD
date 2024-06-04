const { DisconnectReason, makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
            // Envoyer un message d'avertissement à votre propre profil une fois connecté
            const myProfileJid = '50947989665@s.whatsapp.net'; // Remplacez par votre numéro de téléphone
            await sock.sendMessage(myProfileJid, { text: 'Le bot est maintenant connecté.' });
       
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));
        const message = m.messages[0];
        const remoteJid = message.key.remoteJid;
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text;

        // Vérifier si le message commence par le préfixe "!"
        if (messageText && messageText.startsWith('!')) {
            console.log('Répondre à', remoteJid);
            await sock.sendMessage(remoteJid, { text: 'Commande reçue: ' + messageText.slice(1) }); // Réponse en enlevant le préfixe
        }
    });
}

// Lancer la connexion à WhatsApp
connectToWhatsApp();
