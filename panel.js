const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const activeBots = new Map();

function registerPanelModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!panel') {
            const embed = new EmbedBuilder()
                .setColor('#10b981')
                .setTitle('🌙 Bot Yönetimi Nedir?')
                .setDescription(
                    'Standart Discord bot tokenlerini ses kanallarına 7/24 kesintisiz bağlar.\n' +
                    'Aktif bot listesini görebilir, durum varlıklarını değiştirebilir ve bağlantıları kesebilirsin.'
                )
                .addFields({
                    name: '💙 Seçenekler',
                    value: 
                        '» **Bot Sese Kur:** Tekli veya toplu bot tokenlerini ses kanalına sokar\n' +
                        '» **Durum Ayarla:** Aktif botların oynuyor/izliyor durumunu günceller\n' +
                        '» **Aktif Botlar:** Sisteme eklediğin tüm aktif botların listesi\n' +
                        '» **Bağlantıyı Kes:** Ses bağlantılarını güvenle sonlandırır'
                })
                .setFooter({ text: 'Project Swisty Bot Yönetim Sistemi' });

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_panel_kur').setLabel('Bot Sese Kur / Bağlan').setStyle(ButtonStyle.Success).setEmoji('➕'),
                new ButtonBuilder().setCustomId('btn_panel_durum').setLabel('Durum Varlığı Ayarla').setStyle(ButtonStyle.Primary).setEmoji('🌙'),
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_panel_liste').setLabel('Aktif Bot Listesi').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
                new ButtonBuilder().setCustomId('btn_panel_kes').setLabel('Bağlantıyı Kes / Sil').setStyle(ButtonStyle.Danger).setEmoji('🔴')
            );

            await message.channel.send({ embeds: [embed], components: [row1, row2] });
        }
    });

    client.on('interactionCreate', async interaction => {
        const userId = interaction.user.id;
        if (!activeBots.has(userId)) activeBots.set(userId, []);
        const userBotList = activeBots.get(userId);

        if (interaction.isButton()) {
            if (interaction.customId === 'btn_panel_kur') {
                const embed = new EmbedBuilder()
                    .setColor('#3b82f6')
                    .setTitle('📥 Bot Ekleme Tipi Seçin')
                    .setDescription(
                        'Sisteme dahil edeceğiniz standart bot tokenleri için yükleme modunu seçin:\n\n' +
                        '• **Tekli Mod:** Tek bir bot tokeni ve özel kanal tanımlar.\n' +
                        '• **Toplu Mod:** Birden fazla bot tokenini alt alta dizerek tek bir kanala topluca sokar.'
                    );

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_mod_tekli').setLabel('Tekli Bot Ekle').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('btn_mod_toplu').setLabel('Toplu Bot Ekle').setStyle(ButtonStyle.Success)
                );

                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            }
            else if (interaction.customId === 'btn_mod_tekli') {
                const modal = new ModalBuilder().setCustomId('modal_tekli_kur').setTitle('Tekli Bot Kurulumu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_token').setLabel('Bot Token').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_channel').setLabel('Ses Kanalı ID').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_mod_toplu') {
                const modal = new ModalBuilder().setCustomId('modal_toplu_kur').setTitle('Toplu Bot Kurulumu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_tokens').setLabel('Bot Tokenler (Alt alta)').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_channel').setLabel('Ses Kanalı ID').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_panel_durum') {
                if (userBotList.length === 0) {
                    return interaction.reply({ content: '⚠️ Yönetilebilecek aktif botunuz bulunmuyor!', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#6366f1')
                    .setTitle('⚙️ Bot Durum/Aktivite Yönetimi')
                    .setDescription('Durumunu ve aktivite açıklamalarını değiştirmek istediğiniz botu seçin.');

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_durum_bot')
                    .setPlaceholder('🚀 Yönetilecek botu seçiniz...');

                userBotList.forEach((bot, idx) => {
                    selectMenu.addOptions({ label: `Bot ${idx + 1} (${bot.channelId})`, value: `bot_${idx}` });
                });

                await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
            }
            else if (interaction.customId === 'btn_panel_liste') {
                const embed = new EmbedBuilder()
                    .setColor('#10b981')
                    .setTitle('🤖 Size Ait Aktif Bot Listesi')
                    .setDescription(userBotList.length > 0 ? 'Şu an sistemde sizin adınıza seste aktif olan botlarınız:' : '❌ Sistemde aktif botunuz bulunmuyor.');

                if (userBotList.length > 0) {
                    let statusText = '';
                    userBotList.forEach((b) => {
                        statusText += `• **Durum:** 🟢 Bağlı\n**Kanal ID:** \`${b.channelId}\`\n\n`;
                    });
                    embed.addFields({ name: '📋 Operasyon Durumları', value: statusText });
                    embed.setFooter({ text: `Toplam: ${userBotList.length} Bot — Project Swisty` });
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            else if (interaction.customId === 'btn_panel_kes') {
                if (userBotList.length === 0) {
                    return interaction.reply({ content: '⚠️ Kapatılacak aktif bot bulunmuyor!', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#ef4444')
                    .setTitle('❌ Bot Bağlantısını Sonlandır')
                    .setDescription('Aşağıdaki açılır menüyü kullanarak sistemden kaldırmak ve ses bağlantısını kesmek istediğiniz botunuzu seçin.');

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_bot_kapat')
                    .setPlaceholder('🚀 Kapatılacak botu seçiniz...');

                userBotList.forEach((bot, idx) => {
                    selectMenu.addOptions({ label: `Bot ${idx + 1} (Kanal: ${bot.channelId})`, value: `close_${idx}` });
                });

                await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
            }
        }
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_durum_bot') {
                const selectedIndex = interaction.values[0].split('_')[1];
                const modal = new ModalBuilder().setCustomId(`modal_durum_yaz_${selectedIndex}`).setTitle('Bot Aktivite Ayarla');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_activity').setLabel('Oynuyor/Yayınlıyor Mesajı').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'select_bot_kapat') {
                const selectedIndex = interaction.values[0].split('_')[1];
                const targetBot = userBotList[selectedIndex];
                
                if (targetBot && targetBot.client) {
                    try {
                        targetBot.client.destroy();
                    } catch (e) {}
                }
                userBotList.splice(selectedIndex, 1);

                await interaction.update({ content: '✅ Seçilen botun bağlantısı başarıyla sonlandırıldı ve sistemden kaldırıldı.', embeds: [], components: [] });
            }
        }
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_tekli_kur') {
                const token = interaction.fields.getTextInputValue('input_token').trim();
                const channelId = interaction.fields.getTextInputValue('input_channel').trim();
                await interaction.deferReply({ ephemeral: true });

                const { Client } = require('discord.js');
                const subClient = new Client({ 
                    intents: [
                        GatewayIntentBits.Guilds, 
                        GatewayIntentBits.GuildVoiceStates
                    ] 
                });

                subClient.once('ready', async () => {
                    try {
                        const channel = await subClient.channels.fetch(channelId);
                        if (channel && channel.isVoiceBased()) {
                            joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild.voiceAdapterCreator,
                                selfDeaf: true,
                                selfMute: false
                            });
                        }
                    } catch (err) {
                        console.error('Ses bağlantı hatası:', err);
                    }
                });

                try {
                    await subClient.login(token);
                    userBotList.push({ client: subClient, token: token, channelId: channelId, status: 'Aktif' });
                    await interaction.editReply(`✅ **Project Swisty:** Bot başarıyla sese bağlandı! Kanal ID: \`${channelId}\``);
                } catch (err) {
                    await interaction.editReply('❌ Bot bağlanamadı! Token geçersiz ya da bot ilgili sunucuda ekli değil.');
                }
            }
            else if (interaction.customId === 'modal_toplu_kur') {
                const rawTokens = interaction.fields.getTextInputValue('input_tokens').split('\n');
                const channelId = interaction.fields.getTextInputValue('input_channel').trim();
                await interaction.deferReply({ ephemeral: true });

                let successCount = 0;
                for (const t of rawTokens) {
                    const token = t.trim();
                    if (token) {
                        try {
                            const { Client } = require('discord.js');
                            const subClient = new Client({ 
                                intents: [
                                    GatewayIntentBits.Guilds, 
                                    GatewayIntentBits.GuildVoiceStates
                                ] 
                            });

                            subClient.once('ready', async () => {
                                try {
                                    const channel = await subClient.channels.fetch(channelId);
                                    if (channel && channel.isVoiceBased()) {
                                        joinVoiceChannel({
                                            channelId: channel.id,
                                            guildId: channel.guild.id,
                                            adapterCreator: channel.guild.voiceAdapterCreator,
                                            selfDeaf: true,
                                            selfMute: false
                                        });
                                    }
                                } catch (e) {}
                            });

                            await subClient.login(token);
                            userBotList.push({ client: subClient, token: token, channelId: channelId, status: 'Aktif' });
                            successCount++;
                        } catch (e) {}
                    }
                }

                await interaction.editReply(`✅ **Project Swisty:** Toplam ${successCount} adet bot başarıyla sese bağlandı!`);
            }
            else if (interaction.customId.startsWith('modal_durum_yaz')) {
                const index = interaction.customId.split('_')[3];
                const activityText = interaction.fields.getTextInputValue('input_activity');
                const targetBot = userBotList[index];

                if (targetBot && targetBot.client && targetBot.client.user) {
                    try {
                        targetBot.client.user.setActivity(activityText);
                        await interaction.reply({ content: `✅ Botun aktivitesi başarıyla güncellendi: \`${activityText}\``, ephemeral: true });
                    } catch (e) {
                        await interaction.reply({ content: '❌ Aktivite güncellenirken bir hata oluştu.', ephemeral: true });
                    }
                } else {
                    await interaction.reply({ content: '❌ Bot aktif değil veya bulunamadı.', ephemeral: true });
                }
            }
        }
    });
}

module.exports = { registerPanelModule };