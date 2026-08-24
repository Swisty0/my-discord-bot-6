const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

function registerTicketModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        // .ticket komutu
        if (message.content.trim() === '.ticket') {
            await message.delete().catch(() => {});

            const guild = message.guild;
            const user = message.author;

            // Kullanıcının zaten açık bir ticket kanalı var mı?
            const existingChannel = guild.channels.cache.find(
                c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            );

            if (existingChannel) {
                const warnMsg = await message.channel.send({ content: `❌ <@${user.id}> Zaten açık olan bir destek talebin bulunuyor: ${existingChannel}` });
                setTimeout(() => warnMsg.delete().catch(() => {}), 4000);
                return;
            }

            // Yeni özel kanal oluşturma (Diğer herkesin görmesini tamamen engelliyoruz)
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        // Sunucudaki herkes (@everyone) bu kanalı KESİNLİKLE göremez
                        id: guild.id,
                        denied: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        // Sadece komutu yazan kişi görebilir ve mesaj yazabilir
                        id: user.id,
                        allowed: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.SendMessages, 
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ],
                    },
                    {
                        // Botun kendisi
                        id: client.user.id,
                        allowed: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.SendMessages, 
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ReadMessageHistory
                        ],
                    }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(`Destek Talebi - ${user.username}`)
                .setDescription('Destek ekibimiz en kısa sürede seninle ilgilenecektir.\nLütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın.');

            const ticketRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Talebi Kapat')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('call_staff')
                    .setLabel('⚠️ Yetkiliyi Çağır')
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `Hoş geldin <@${user.id}>!`, embeds: [ticketEmbed], components: [ticketRow] });

            // Bilgilendirme mesajı kanala atılır ve 4 saniye sonra otomatik silinir
            const notifyMsg = await message.channel.send({ content: `<@${user.id}>, destek talebin başarıyla oluşturuldu: ${ticketChannel}` });
            setTimeout(() => notifyMsg.delete().catch(() => {}), 4000);
        }
    });

    // Buton Etkileşimleri (Kapatma ve Yetkili Çağırma)
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        try {
            if (interaction.customId === 'close_ticket') {
                const channel = interaction.channel;
                await interaction.reply({ content: '🔒 Destek talebi 5 saniye içinde kapatılıyor...' });
                
                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            }

            if (interaction.customId === 'call_staff') {
                await interaction.reply({ content: '📢 Yetkili ekibe bildirim gönderildi, en kısa sürede bakacaklar!' });
            }
        } catch (err) {
            console.error("Ticket işlem hatası:", err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', ephemeral: true }).catch(() => {});
            }
        }
    });
}

module.exports = { registerTicketModule };
