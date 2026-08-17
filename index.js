const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const { registerPanelModule } = require('./modules/panel');
const { registerHesaplarModule } = require('./modules/hesaplar');
const { registerTempMailModule } = require('./modules/tempmail');
const { registerCopyModule } = require('./modules/kopyala');
const { registerListDmModule } = require('./modules/listdm');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.once('ready', () => {
    console.log(`[ANA BOT] ${client.user.tag} aktif ve modüller başarıyla yüklendi!`);
});

// Tüm modülleri ana cliente bağlıyoruz
registerPanelModule(client);
registerHesaplarModule(client);
registerTempMailModule(client);
registerCopyModule(client);
registerListDmModule(client);

client.login(process.env.TOKEN);