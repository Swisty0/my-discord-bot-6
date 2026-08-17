const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Uptime (7/24 aktif tutma) için basit Express sunucusu
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Project Swisty Bot 7/24 aktif!');
});

app.listen(PORT, () => {
    console.log(`[EXPRESS] Web sunucusu ${PORT} portunda çalışıyor.`);
});

// Modüllerin içe aktarılması
const { registerPanelModule } = require('./modules/panel');
const { registerTempMailModule } = require('./modules/tempmail');
const { registerCopyModule } = require('./modules/kopyala');
const { registerListDmModule } = require('./modules/listdm');

// Ana Bot Client Tanımlaması
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
    console.log(`[PROJECT SWISTY] ${client.user.tag} aktif ve tüm modüller başarıyla yüklendi!`);
});

// Modüllerin ana cliente bağlanması
registerPanelModule(client);
registerTempMailModule(client);
registerCopyModule(client);
registerListDmModule(client);

// Botun Giriş Yapması (.env dosyasındaki TOKEN'ı kullanır)
client.login(process.env.TOKEN);
