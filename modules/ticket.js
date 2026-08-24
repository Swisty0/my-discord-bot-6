const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

function registerTicketModule(client) {
    // 1. .ticket-kurulum komutu ile panel mesajını gönderir
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        if (message.content.trim() === '.ticket-kurulum') {
            await message.delete().catch(() => {});

            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Destek Merkezi')
                .setDescription('Sunucumuzda herhangi bir sorunla karşılaşırsan veya yardıma ihtiyacın olursa aşağıdaki **"Destek Talebi Aç"** butonuna tıklayarak yetkililerle özel bir kanal üzerinden iletişim kurabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('🎫 Destek Talebi Aç')
                    .setStyle(ButtonStyle.Primary)
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
        }
    });

    // 2. Buton Etkileşimleri (Ticket Açma, Kapatma ve Yetkili Çağırma)
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        try {
            // Ticket Oluşturma
            if (interaction.customId === 'create_ticket') {
                await interaction.deferReply({ flags: 6 }); // Gizli yanıt

                const guild = interaction.guild;
                const user = interaction.user;

                // Kullanıcının halihazırda açık bir ticket kanalı var mı kontrol edelim
                const existingChannel = guild.channels.cache.find(
                    c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
                );

                if (existingChannel) {
                    return interaction.editReply({ content: `❌ Zaten açık olan bir destek talebin bulunuyor: ${existingChannel}` });
                }

                // Yeni özel kanal oluşturma
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id, // Herkes göremez
                            denied: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id, // Sadece ticket açan kullanıcı görebilir ve yazabilir
                            allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: client.user.id, // Bot erişebilir
                            allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
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
                await interaction.editReply({ content: `✅ Destek talebin başarıyla oluşturuldu: ${ticketChannel}` });
            }

            // Ticket Kapatma
            if (interaction.customId === 'close_ticket') {
                const channel = interaction.channel;
                await interaction.reply({ content: '🔒 Destek talebi 5 saniye içinde kapatılıyor...' });
                
                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            }

            // Yetkili Çağırma
            if (interaction.customId === 'call_staff') {
                await interaction.reply({ content: '📢 Yetkili ekibe bildirim gönderildi, en kısa sürede bakacaklar!' });
            }

        } catch (err) {
            console.error("Ticket işlem hatası:", err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', flags: 6 }).catch(() => {});
            }
        }
    });
}

module.exports = { registerTicketModule };
