const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');

const userVaults = new Map();

async function validateToken(token) {
    try {
        const res = await axios.get('https://discord.com/api/v9/users/@me', { headers: { 'Authorization': token } });
        return { valid: true, username: res.data.username };
    } catch (e) {
        return { valid: false };
    }
}

function getUserVault(userId) {
    if (!userVaults.has(userId)) {
        userVaults.set(userId, { accounts: [] });
    }
    return userVaults.get(userId);
}

function registerHesaplarModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!hesaplarım') {
            const vault = getUserVault(message.author.id);
            let accountListText = vault.accounts.length > 0 
                ? vault.accounts.map(acc => `🤍 \`${acc.name}\` — 💤 ${acc.status}`).join('\n')
                : '❌ Henüz eklenmiş bir hesabınız yok.';

            const embed = new EmbedBuilder()
                .setColor('#ef4444')
                .setTitle('🛡️ Hesap Kontrol Paneli')
                .addFields({ name: `📊 Kayıtlı Hesaplar (${vault.accounts.length})`, value: accountListText });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_hesap_yonet')
                .setPlaceholder(vault.accounts.length > 0 ? '🔍 Hesap seç → durum değiştir...' : '⚠️ Önce token ekleyin...');

            if (vault.accounts.length > 0) {
                vault.accounts.forEach((acc, index) => {
                    selectMenu.addOptions({ label: acc.name, description: `Durum: ${acc.status}`, value: `account_${index}` });
                });
            } else {
                selectMenu.addOptions({ label: 'Hesap Yok', value: 'no_account' }).setDisabled(true);
            }

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_token_ekle').setLabel('Token Ekle').setStyle(ButtonStyle.Success).setEmoji('➕'),
                new ButtonBuilder().setCustomId('btn_ses_afk').setLabel('Ses AFK').setStyle(ButtonStyle.Primary).setEmoji('🔊'),
                new ButtonBuilder().setCustomId('btn_token_kontrol').setLabel('Token Kontrol (DM)').setStyle(ButtonStyle.Secondary).setEmoji('🧪')
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_gecersiz_sil').setLabel('Temizle').setStyle(ButtonStyle.Secondary).setEmoji('🗑️'),
                new ButtonBuilder().setCustomId('btn_tumunu_durdur').setLabel('Durdur').setStyle(ButtonStyle.Danger).setEmoji('🔴')
            );

            await message.channel.send({ embeds: [embed], components: [row1, row2, row3] });
        }
    });

    client.on('interactionCreate', async interaction => {
        const userId = interaction.user.id;
        const vault = getUserVault(userId);

        if (interaction.isButton()) {
            if (interaction.customId === 'btn_token_ekle') {
                const modal = new ModalBuilder().setCustomId('modal_token_ekle').setTitle('Havuza Token Ekle');
                const tokenInput = new TextInputBuilder().setCustomId('input_havuz_tokens').setLabel('Selfbot Token(lar)').setStyle(TextInputStyle.Paragraph).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(tokenInput));
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_ses_afk') {
                if (vault.accounts.length === 0) return interaction.reply({ content: '⚠️ Önce token eklemelisin!', ephemeral: true });
                const selectMenu = new StringSelectMenuBuilder().setCustomId('select_ses_hesap').setPlaceholder('Sese bağlanacak hesabı seç...');
                vault.accounts.forEach((acc, index) => selectMenu.addOptions({ label: acc.name, value: `ses_${index}` }));
                await interaction.reply({ components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
            }
            else if (interaction.customId === 'btn_token_kontrol') {
                if (vault.accounts.length === 0) return interaction.reply({ content: '⚠️ Hesap bulunamadı!', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                let report = "🧪 **Token Kontrol Raporu:**\n";
                for (const acc of vault.accounts) {
                    const check = await validateToken(acc.token);
                    report += `${check.valid ? '✅' : '❌'} \`${acc.name}\`: ${check.valid ? 'Aktif' : 'Geçersiz'}\n`;
                }
                await interaction.user.send(report);
                await interaction.editReply({ content: '✅ Rapor DM kutunuza gönderildi.' });
            }
            else if (interaction.customId === 'btn_gecersiz_sil') {
                vault.accounts = [];
                await interaction.reply({ content: '🗑️ Hesap havuzu temizlendi.', ephemeral: true });
            }
            else if (interaction.customId === 'btn_tumunu_durdur') {
                vault.accounts.forEach(acc => acc.status = 'Pasif');
                await interaction.reply({ content: '🔴 Tüm hesaplar pasife alındı.', ephemeral: true });
            }
        }
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_hesap_yonet') {
                const index = interaction.values[0].replace('account_', '');
                const acc = vault.accounts[index];
                if (acc) {
                    acc.status = acc.status === 'Pasif' ? 'Aktif' : 'Pasif';
                    await interaction.reply({ content: `⚙️ ${acc.name} durumu: **${acc.status}**`, ephemeral: true });
                }
            }
            else if (interaction.customId === 'select_ses_hesap') {
                const index = interaction.values[0].split('_')[1];
                const modal = new ModalBuilder().setCustomId(`modal_ses_bagla_${index}`).setTitle('Ses Kanalı ID');
                const channelInput = new TextInputBuilder().setCustomId('input_channel').setLabel('Kanal ID').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(channelInput));
                await interaction.showModal(modal);
            }
        }
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_token_ekle') {
                const rawTokens = interaction.fields.getTextInputValue('input_havuz_tokens').split('\n');
                await interaction.deferReply({ ephemeral: true });
                let count = 0;
                for (const t of rawTokens) {
                    const token = t.trim();
                    if (token) {
                        const check = await validateToken(token);
                        if (check.valid && !vault.accounts.some(a => a.token === token)) {
                            vault.accounts.push({ name: check.username, status: 'Pasif', token: token });
                            count++;
                        }
                    }
                }
                await interaction.editReply(`✅ ${count} adet token doğrulandı ve isimleriyle kaydedildi.`);
            }
            else if (interaction.customId.startsWith('modal_ses_bagla')) {
                const index = interaction.customId.split('_')[3];
                const channelId = interaction.fields.getTextInputValue('input_channel');
                vault.accounts[index].status = 'Aktif';
                await interaction.reply({ content: `🔊 Hesap başarıyla \`${channelId}\` ID'li kanala bağlandı!`, ephemeral: true });
            }
        }
    });
}

module.exports = { registerHesaplarModule };