const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Render'ın uyku moduna girmesini önleyen Express sunucusu
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Project Swisty Bot 7/24 aktif!');
});

app.listen(PORT, () => {
    console.log(`[EXPRESS] Web sunucusu ${PORT} portunda çalışıyor.`);
});

// Tüm modüllerin güvenli içe aktarılması
const { registerWelcomeModule } = require('./modules/welcome');
const { registerPanelModule } = require('./modules/panel');
const { registerHesaplarModule } = require('./modules/hesaplar');
const { registerTempMailModule } = require('./modules/tempmail');
const { registerCopyModule } = require('./modules/kopyala');
const { registerListDmModule } = require('./modules/listdm');
const { registerStatsModule } = require('./modules/stats');
const { registerCekilisModule } = require('./modules/cekilis');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,    ]
});

client.once('ready', () => {
    console.log(`[ANA BOT] ${client.user.tag} aktif ve tüm modüller başarıyla yüklendi!`);
});

// Modüllerin ana cliente bağlanması
registerPanelModule(client);
registerHesaplarModule(client);
registerTempMailModule(client);
registerCopyModule(client);
registerListDmModule(client);
registerWelcomeModule(client);
registerStatsModule(client);
registerCekilisModule(client);

client.login(process.env.TOKEN);
